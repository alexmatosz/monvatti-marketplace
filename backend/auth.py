"""Login e sessão por token. O acesso à extensão passa por aqui."""

import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import config, email_envio, pagamento, security
from backend.db import get_db
from backend.models import CodigoLogin, Usuario, agora

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Entrada(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    codigo: str = Field(default="", max_length=20)


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
    if (u.sessao_versao or 0) != dados.get("v"):
        raise HTTPException(401, "Sua conta entrou em outro computador e esta sessão foi encerrada. Entre de novo para usar aqui.")
    if not pagamento.assinatura_valida(u):
        raise HTTPException(402, f"Seu acesso venceu. Renove em {config.LANDING_URL} com o mesmo e-mail.")
    return u


def exigir_admin(u: Usuario = Depends(usuario_atual)) -> Usuario:
    if u.papel != "admin":
        raise HTTPException(403, "Só o administrador pode fazer isso.")
    return u


def _usuario_liberado(db: Session, email: str) -> Usuario:
    """Quem pode pedir código/entrar: cadastrado, ativo e com acesso pago em dia."""
    u = db.query(Usuario).filter(Usuario.email == email).first()
    if not u:
        raise HTTPException(404, "Não achamos uma compra com este e-mail. Confira se é o mesmo e-mail usado "
                                 f"no pagamento ou garanta seu acesso em {config.LANDING_URL}.")
    if not u.ativo:
        raise HTTPException(403, f"Acesso desativado. Fale com o suporte: {config.EMAIL_SUPORTE}.")
    if not pagamento.assinatura_valida(u):
        venceu = f" em {u.assinatura_ate.astimezone().strftime('%d/%m/%Y')}" if u.assinatura_ate else ""
        raise HTTPException(402, f"Seu acesso venceu{venceu}. Renove em {config.LANDING_URL} com este mesmo e-mail.")
    return u


def _hash_codigo(email: str, codigo: str) -> str:
    return hmac.new(config.SECRET.encode(), f"{email}:{codigo}".encode(), hashlib.sha256).hexdigest()


@router.post("/codigo")
def pedir_codigo(dados: Entrada, db: Session = Depends(get_db)):
    """1º passo do login: manda um código de 6 dígitos para o e-mail do cliente."""
    email = dados.email.strip().lower()
    _usuario_liberado(db, email)
    recente = (db.query(CodigoLogin).filter(CodigoLogin.email == email)
               .order_by(CodigoLogin.criado_em.desc()).first())
    if recente and _aware(recente.criado_em) > agora() - timedelta(seconds=30):
        raise HTTPException(429, "Acabamos de enviar um código. Espere alguns segundos para pedir outro.")
    db.query(CodigoLogin).filter(CodigoLogin.email == email, CodigoLogin.usado.is_(False)).update({"usado": True})
    codigo = f"{secrets.randbelow(1_000_000):06d}"
    db.add(CodigoLogin(email=email, codigo_hash=_hash_codigo(email, codigo),
                       vence_em=agora() + timedelta(minutes=config.CODIGO_MINUTOS)))
    db.commit()
    try:
        email_envio.enviar_codigo(email, codigo)
    except email_envio.ErroEmail as e:
        raise HTTPException(503, str(e))
    return {"ok": True, "minutos": config.CODIGO_MINUTOS}


@router.post("/login")
def login(dados: Entrada, db: Session = Depends(get_db)):
    """2º passo: e-mail + código. Devolve o token de sessão (vale TOKEN_VALIDADE_DIAS)."""
    email = dados.email.strip().lower()
    u = _usuario_liberado(db, email)
    codigo = re.sub(r"\D", "", dados.codigo or "")
    pendente = (db.query(CodigoLogin).filter(CodigoLogin.email == email, CodigoLogin.usado.is_(False))
                .order_by(CodigoLogin.criado_em.desc()).first())
    if not codigo:
        raise HTTPException(422, "Digite o código que chegou no seu e-mail.")
    if not pendente or _aware(pendente.vence_em) < agora():
        raise HTTPException(401, "Código vencido. Clique em “Reenviar código” para receber outro.")
    if pendente.tentativas >= config.CODIGO_TENTATIVAS:
        raise HTTPException(429, "Muitas tentativas. Clique em “Reenviar código” para receber outro.")
    if not hmac.compare_digest(pendente.codigo_hash, _hash_codigo(email, codigo)):
        pendente.tentativas += 1
        db.commit()
        raise HTTPException(401, "Código incorreto. Confira o último e-mail que enviamos.")
    pendente.usado = True
    u.ultimo_acesso_em = agora()
    # Uma sessão por conta: entrar aqui derruba a sessão aberta em outro computador.
    u.sessao_versao = (u.sessao_versao or 0) + 1
    db.commit()
    return {"token": security.criar_token(u.id, u.sessao_versao), "usuario": _como_json(u)}


def _aware(d: datetime) -> datetime:
    """SQLite devolve datas sem fuso; trata como UTC."""
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


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
