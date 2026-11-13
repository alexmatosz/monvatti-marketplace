"""Cadastro público pela landing page.

Cria um usuário PENDENTE (sem assinatura ativa) — ele ainda não entra na
extensão. Quando o pagamento entrar, o webhook liga a assinatura e o acesso é
liberado.

Devolve um `convite` (assinado, 7 dias) para a landing mostrar o passo
"Conectar ao Mercado Livre". O convite só sai para quem acabou de se cadastrar
ou ainda não conectou o ML; para os outros, a resposta é só ok (o cliente
conecta pelo popup da extensão). Quando o pagamento existir, o convite passa
a sair na confirmação do pagamento, não aqui.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend import security
from backend.db import get_db
from backend.models import ContaML, Usuario

router = APIRouter(prefix="/api", tags=["cadastro"])


class Cadastro(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=200)


@router.post("/cadastro")
def cadastro(dados: Cadastro, db: Session = Depends(get_db)):
    email = dados.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "E-mail inválido.")
    u = db.query(Usuario).filter(Usuario.email == email).first()
    if not u:
        u = Usuario(nome=dados.nome.strip()[:200], email=email, papel="equipe", assinatura_ativa=False)
        db.add(u)
        db.commit()
    elif db.query(ContaML).filter(ContaML.usuario_id == u.id).first():
        return {"ok": True}
    return {"ok": True, "convite": security.criar_convite(u.id)}
