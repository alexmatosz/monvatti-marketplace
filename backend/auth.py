"""Login e sessão por token. O acesso à extensão passa por aqui.

Entrar é em dois passos: /codigo manda um código de 6 dígitos para o e-mail e
/login troca e-mail + código pelo token. Ninguém entra só sabendo o e-mail de
um cliente. O código só é pedido de novo se a sessão cair: cada login sobe
sessao_versao, então só UM navegador fica logado por assinatura (entrar em
outro derruba o anterior).
"""

import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, email_envio, pagamento, security
from backend.db import get_db
from backend.models import CodigoLogin, Usuario, agora

router = APIRouter(prefix="/api/auth", tags=["auth"])
log = logging.getLogger("monvatti.auth")

VALIDADE_CODIGO = timedelta(minutes=10)
SAIU_POR_OUTRO_LOGIN = ("Sua conta foi aberta em outro navegador e esta sessão foi encerrada. "
                        "Para usar aqui, entre de novo com o código do e-mail.")
ESPERA_REENVIO = timedelta(seconds=45)
TENTATIVAS = 5


class PedirCodigo(BaseModel):
    email: str = Field(min_length=3, max_length=200)


class Entrada(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    codigo: str = Field(min_length=4, max_length=12)


class NovoUsuario(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=200)
    papel: str = Field(default="equipe", pattern="^(admin|equipe)$")


def _como_json(u: Usuario) -> dict:
    return {"id": u.id, "nome": u.nome, "email": u.email, "papel": u.papel,
            "imposto": u.imposto_padrao, "assinatura_ativa": pagamento.assinatura_valida(u)}


def usuario_atual(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> Usuario:
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Faça login na extensão.")
    dados = security.ler_token(authorization[7:].strip())
    if not dados:
        raise HTTPException(401, "Sessão expirada. Entre de novo.")
    u = db.get(Usuario, dados["u"])
    if not u or not u.ativo:
        raise HTTPException(401, "Acesso encerrado. Entre de novo.")
    if u.sessao_versao != dados.get("v"):
        raise HTTPException(401, SAIU_POR_OUTRO_LOGIN)
    if not pagamento.assinatura_valida(u):
        raise HTTPException(402, "Assinatura inativa. Fale com o administrador.")
    return u


def exigir_admin(u: Usuario = Depends(usuario_atual)) -> Usuario:
    if u.papel != "admin":
        raise HTTPException(403, "Só o administrador pode fazer isso.")
    return u


def _usuario_que_pode_entrar(db: Session, email: str) -> Usuario:
    u = db.query(Usuario).filter(Usuario.email == email).first()
    if not u:
        raise HTTPException(401, "E-mail não cadastrado. Faça o cadastro na página da Monvatti.")
    if not u.ativo:
        raise HTTPException(403, "Acesso desativado. Fale com o suporte da Monvatti.")
    if not pagamento.assinatura_valida(u):
        raise HTTPException(402, "Assinatura inativa. Conclua o pagamento na página da Monvatti.")
    return u


def _aware(d):
    return d if d is None or d.tzinfo else d.replace(tzinfo=agora().tzinfo)


@router.post("/codigo")
def pedir_codigo(dados: PedirCodigo, db: Session = Depends(get_db)):
    """1º passo: manda o código para o e-mail do cliente."""
    email = dados.email.strip().lower()
    u = _usuario_que_pode_entrar(db, email)
    ultimo = (db.query(CodigoLogin).filter(CodigoLogin.email == email)
              .order_by(CodigoLogin.id.desc()).first())
    if ultimo and agora() - _aware(ultimo.criado_em) < ESPERA_REENVIO:
        raise HTTPException(429, "Acabamos de mandar um código. Espere alguns segundos para pedir outro.")
    db.query(CodigoLogin).filter(CodigoLogin.email == email, CodigoLogin.usado.is_(False)).update({"usado": True})
    codigo = security.novo_codigo_login()
    db.add(CodigoLogin(email=email, codigo_hash=security.hash_codigo_login(email, codigo),
                       expira_em=agora() + VALIDADE_CODIGO))
    db.commit()
    try:
        enviado = email_envio.enviar_codigo(email, u.nome, codigo)
    except Exception:  # noqa: BLE001 — falha de SMTP não pode derrubar o servidor
        log.exception("Falha ao mandar o código para %s", email)
        raise HTTPException(503, "Não consegui mandar o e-mail agora. Tente de novo em instantes.")
    resposta = {"enviado": enviado, "validade_min": int(VALIDADE_CODIGO.total_seconds() // 60)}
    if not enviado:
        if not config.MODO_DEMONSTACAO:
            raise HTTPException(503, "O envio de e-mail não está configurado no servidor. Fale com o suporte.")
        resposta["codigo_teste"] = codigo  # só sem SMTP e no modo demonstração (teste local)
    return resposta


@router.post("/login")
def login(dados: Entrada, db: Session = Depends(get_db)):
    """2º passo: e-mail + código de 6 dígitos (vale 10 min, 5 tentativas, um uso)."""
    email = dados.email.strip().lower()
    u = _usuario_que_pode_entrar(db, email)
    c = (db.query(CodigoLogin).filter(CodigoLogin.email == email, CodigoLogin.usado.is_(False))
         .order_by(CodigoLogin.id.desc()).first())
    if not c or _aware(c.expira_em) < agora() or c.tentativas >= TENTATIVAS:
        raise HTTPException(401, "Código vencido. Peça um novo código.")
    c.tentativas += 1
    if not security.hmac.compare_digest(c.codigo_hash, security.hash_codigo_login(email, dados.codigo.strip())):
        db.commit()
        restam = TENTATIVAS - c.tentativas
        raise HTTPException(401, f"Código errado. Restam {restam} tentativa{'s' if restam != 1 else ''}." if restam
                            else "Código errado. Peça um novo código.")
    c.usado = True
    # Uma sessão por assinatura: entrar aqui derruba o navegador que estava logado.
    u.sessao_versao = (u.sessao_versao or 0) + 1
    u.ultimo_acesso_em = agora()
    db.commit()
    return {"token": security.criar_token(u.id, u.sessao_versao), "usuario": _como_json(u)}


@router.get("/eu")
def eu(u: Usuario = Depends(usuario_atual)):
    return _como_json(u)


@router.post("/usuarios")
def criar_usuario(dados: NovoUsuario, _adm: Usuario = Depends(exigir_admin), db: Session = Depends(get_db)):
    email = dados.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "E-mail inválido.")
    if db.query(Usuario).filter(Usuario.email == email).first():
        raise HTTPException(409, "Já existe um usuário com esse e-mail.")
    u = Usuario(nome=dados.nome, email=email, papel=dados.papel)
    db.add(u)
    db.commit()
    return {"id": u.id, "email": u.email}
