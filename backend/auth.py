"""Login e sessão por token. O acesso à extensão passa por aqui."""

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import pagamento, security
from backend.db import get_db
from backend.models import Usuario, agora

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Entrada(BaseModel):
    email: str = Field(min_length=3, max_length=200)


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
    if not u or not u.ativo or u.sessao_versao != dados.get("v"):
        raise HTTPException(401, "Acesso encerrado. Entre de novo.")
    if not pagamento.assinatura_valida(u):
        raise HTTPException(402, "Assinatura inativa. Fale com o administrador.")
    return u


def exigir_admin(u: Usuario = Depends(usuario_atual)) -> Usuario:
    if u.papel != "admin":
        raise HTTPException(403, "Só o administrador pode fazer isso.")
    return u


@router.post("/login")
def login(dados: Entrada, db: Session = Depends(get_db)):
    """Login só por e-mail (sem senha). Só entra quem já está cadastrado como
    pago. Enquanto não há landing/pagamento, o administrador cria os usuários.
    Depois, o cadastro+pagamento (AbacatePay) passa a criar e liberar sozinho."""
    u = db.query(Usuario).filter(Usuario.email == dados.email.strip().lower()).first()
    if not u:
        raise HTTPException(401, "E-mail não cadastrado. Fale com o administrador.")
    if not u.ativo:
        raise HTTPException(403, "Acesso desativado. Fale com o administrador.")
    if not pagamento.assinatura_valida(u):
        raise HTTPException(402, "Assinatura inativa. Fale com o administrador.")
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
