"""Pagamento por Pix ou cartão (AbacatePay) e a regra de acesso.

Fluxo:
1. A landing chama POST /api/pagamento/checkout com nome, e-mail, plano e forma
   de pagamento. Criamos (ou achamos) o usuário, garantimos o produto daquele
   plano/forma/preço no AbacatePay, criamos a cobrança e devolvemos o link; a
   landing redireciona o cliente para lá. O Pix sai com desconto (DESCONTO_PIX).
2. Pago, o AbacatePay chama POST /api/pagamento/webhook (evento
   checkout.completed). Conferimos o segredo, confirmamos o status direto na API
   e liberamos os dias do plano. Cada cobrança libera uma vez só.
3. O cliente recebe o e-mail de boas-vindas com o link da extensão.

`assinatura_valida` continua sendo a única pergunta que o resto do sistema faz.
Renovar = pagar de novo pela landing com o mesmo e-mail (os dias se somam).
"""

import hmac
import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, email_envio
from backend.db import get_db
from backend.models import Pagamento, Usuario, agora

log = logging.getLogger("monvatti.pagamento")
router = APIRouter(prefix="/api/pagamento", tags=["pagamento"])
API = "https://api.abacatepay.com/v2"


def _utc(d: datetime | None) -> datetime | None:
    return d if d is None or d.tzinfo else d.replace(tzinfo=timezone.utc)


def assinatura_valida(usuario: Usuario) -> bool:
    """Único ponto que decide se o usuário pode usar o estudo."""
    if not usuario.assinatura_ativa:
        return False
    ate = _utc(usuario.assinatura_ate)
    return not (ate and ate < datetime.now(timezone.utc))


class ErroPagamento(Exception):
    pass


def _abacate(metodo: str, caminho: str, **kw) -> dict:
    if not config.ABACATEPAY_API_KEY:
        raise ErroPagamento("Pagamento ainda não configurado no servidor (ABACATEPAY_API_KEY).")
    try:
        r = httpx.request(metodo, API + caminho, timeout=20,
                          headers={"Authorization": f"Bearer {config.ABACATEPAY_API_KEY}"}, **kw)
    except httpx.HTTPError as e:
        raise ErroPagamento("O sistema de pagamento não respondeu. Tente de novo em instantes.") from e
    corpo = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    if r.status_code >= 400 or corpo.get("error"):
        log.error("AbacatePay %s %s -> %s %s", metodo, caminho, r.status_code, r.text[:500])
        erro = ErroPagamento("Não consegui gerar o pagamento agora. Tente de novo em instantes.")
        erro.detalhe = str(corpo.get("error") or r.text[:300])
        raise erro
    return corpo.get("data") or {}


_produtos_prontos: set[str] = set()


def _garantir_produto(plano: str, metodo: str) -> str:
    """externalId do produto do plano nessa forma e preço; cria no AbacatePay se faltar.

    O preço entra no id: mudar o preço gera um produto novo e nunca cobra o valor antigo.
    """
    centavos = config.preco(plano, metodo)
    ext = f"monvatti-ml-{plano}-{metodo}-{centavos}"
    if ext in _produtos_prontos:
        return ext
    info = config.PLANOS[plano]
    rotulo = "Pix" if metodo == "pix" else "cartão"
    try:
        _abacate("POST", "/products/create", json={
            "externalId": ext,
            "name": f"Monvatti Marketplace · {info['nome']} ({rotulo})",
            "description": f"{info['dias']} dias de acesso à extensão Monvatti Marketplace.",
            "price": centavos,
            "currency": "BRL",
        })
    except ErroPagamento as e:
        if "already exists" not in getattr(e, "detalhe", ""):
            raise
    _produtos_prontos.add(ext)
    return ext


@router.get("/precos")
def precos():
    """Preços que a landing mostra (os mesmos que vão para a cobrança)."""
    return {
        "pagamento_disponivel": bool(config.ABACATEPAY_API_KEY),
        "modo_teste": config.PAGAMENTO_TESTE,
        "dias_teste": config.DIAS_TESTE,
        "desconto_pix": config.DESCONTO_PIX,
        "planos": {
            k: {"dias": v["dias"], "parcelas": v["parcelas"],
                "cartao": config.preco(k, "cartao"), "pix": config.preco(k, "pix")}
            for k, v in config.PLANOS.items()
        },
    }


class Checkout(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=200)
    celular: str = Field(default="", max_length=30)
    plano: str = Field(default="mensal", pattern="^(mensal|semestral|anual)$")
    metodo: str = Field(default="pix", pattern="^(pix|cartao)$")


def _usuario_da_compra(dados: Checkout, db: Session) -> Usuario:
    email = dados.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(422, "Confira o e-mail: é por ele que você vai entrar na extensão.")
    u = db.query(Usuario).filter(Usuario.email == email).first()
    if not u:
        u = Usuario(nome=dados.nome.strip()[:200], email=email, papel="equipe", assinatura_ativa=False)
        db.add(u)
        db.commit()
    elif not u.ativo:
        raise HTTPException(403, f"Este acesso foi desativado. Fale com o suporte: {config.EMAIL_SUPORTE}.")
    return u


@router.post("/teste")
def liberar_teste(dados: Checkout, db: Session = Depends(get_db)):
    """Modo de teste: libera DIAS_TESTE dias sem cobrança, uma vez por e-mail."""
    if not config.PAGAMENTO_TESTE:
        raise HTTPException(404, "O acesso de teste não está disponível.")
    u = _usuario_da_compra(dados, db)
    ja_testou = db.query(Pagamento).filter(Pagamento.usuario_id == u.id,
                                           Pagamento.checkout_id.like("teste-%")).first()
    if ja_testou or assinatura_valida(u):
        return {"ok": True, "novo": False}
    pag = Pagamento(usuario_id=u.id, checkout_id=f"teste-{u.id}-{int(agora().timestamp())}",
                    valor_centavos=0, plano=dados.plano, dias=config.DIAS_TESTE)
    db.add(pag)
    db.commit()
    u = liberar(db, pag)
    if u:
        try:
            email_envio.enviar_boas_vindas(u.email, u.nome, u.assinatura_ate.astimezone().strftime("%d/%m/%Y"), teste=True)
        except email_envio.ErroEmail:
            log.exception("Acesso de teste liberado, mas o e-mail falhou (%s)", u.email)
    return {"ok": True, "novo": True}


@router.post("/checkout")
def criar_checkout(dados: Checkout, db: Session = Depends(get_db)):
    u = _usuario_da_compra(dados, db)
    email = u.email
    dias = config.PLANOS[dados.plano]["dias"]
    try:
        produto = _garantir_produto(dados.plano, dados.metodo)
        cliente = {"email": email, "name": dados.nome.strip()[:200]}
        if dados.celular.strip():
            cliente["cellphone"] = dados.celular.strip()
        cliente_id = _abacate("POST", "/customers/create", json=cliente).get("id")
        cobranca = _abacate("POST", "/checkouts/create", json={
            "items": [{"id": produto, "quantity": 1}],
            **({"methods": ["PIX"]} if dados.metodo == "pix" else
               {"methods": ["CARD"], "card": {"maxInstallments": config.PLANOS[dados.plano]["parcelas"]}}),
            "customerId": cliente_id,
            "externalId": f"usuario-{u.id}-{dados.plano}-{dados.metodo}-{int(agora().timestamp())}",
            "returnUrl": config.LANDING_URL,
            "completionUrl": f"{config.LANDING_URL}/obrigado",
            "metadata": {"usuario_id": u.id, "email": email, "plano": dados.plano, "metodo": dados.metodo},
        })
    except ErroPagamento as e:
        raise HTTPException(503, str(e))
    if not cobranca.get("id") or not cobranca.get("url"):
        raise HTTPException(503, "Não consegui gerar o pagamento agora. Tente de novo em instantes.")
    # Mesmo externalId no mesmo segundo (clique duplo): o AbacatePay devolve a cobrança já criada.
    if db.query(Pagamento).filter(Pagamento.checkout_id == cobranca["id"]).first():
        return {"url": cobranca["url"]}
    db.add(Pagamento(usuario_id=u.id, checkout_id=cobranca["id"], url=cobranca["url"],
                     valor_centavos=cobranca.get("amount"), plano=dados.plano, dias=dias))
    db.commit()
    return {"url": cobranca["url"]}


def liberar(db: Session, pag: Pagamento) -> Usuario | None:
    """Soma os dias do plano ao acesso do dono da cobrança (idempotente)."""
    if pag.status == "PAID":
        return None
    u = db.get(Usuario, pag.usuario_id)
    if not u:
        return None
    base = max(_utc(u.assinatura_ate) or agora(), agora())
    u.assinatura_ate = base + timedelta(days=pag.dias or 30)
    u.assinatura_ativa = True
    pag.status, pag.pago_em, pag.liberado_ate = "PAID", agora(), u.assinatura_ate
    db.commit()
    return u


@router.post("/webhook")
async def webhook(request: Request, webhookSecret: str = "", db: Session = Depends(get_db)):
    segredo = request.headers.get("x-webhook-secret") or webhookSecret
    if not config.ABACATEPAY_WEBHOOK_SECRET or not hmac.compare_digest(segredo, config.ABACATEPAY_WEBHOOK_SECRET):
        raise HTTPException(401, "segredo inválido")
    evento = await request.json()
    if evento.get("event") != "checkout.completed":
        return {"ok": True, "ignorado": evento.get("event")}
    checkout_id = ((evento.get("data") or {}).get("checkout") or {}).get("id", "")
    pag = db.query(Pagamento).filter(Pagamento.checkout_id == checkout_id).first()
    if not pag:
        log.warning("Webhook de checkout desconhecido: %s", checkout_id)
        return {"ok": True, "ignorado": "checkout desconhecido"}
    # Não confia só no corpo do webhook: confirma o status na própria API.
    try:
        status = _abacate("GET", "/checkouts/get", params={"id": checkout_id}).get("status")
    except ErroPagamento:
        raise HTTPException(503, "não consegui confirmar o pagamento")
    if status != "PAID":
        return {"ok": True, "status": status}
    u = liberar(db, pag)
    if u:
        try:
            email_envio.enviar_boas_vindas(u.email, u.nome, u.assinatura_ate.astimezone().strftime("%d/%m/%Y"))
        except email_envio.ErroEmail:
            log.exception("Pagamento liberado, mas o e-mail de boas-vindas falhou (%s)", u.email)
    return {"ok": True}


@router.get("/situacao")
def situacao(email: str, db: Session = Depends(get_db)):
    """A página /obrigado da landing pergunta se o pagamento já caiu."""
    u = db.query(Usuario).filter(Usuario.email == email.strip().lower()).first()
    return {"liberado": bool(u and assinatura_valida(u)), "link_extensao": config.LINK_EXTENSAO,
            "teste": config.PAGAMENTO_TESTE}
