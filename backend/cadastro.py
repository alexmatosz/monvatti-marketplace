"""Cadastro público pela landing page.

Cria um usuário PENDENTE (sem assinatura ativa) — ele ainda não entra na
extensão. Quando o pagamento (AbacatePay) entrar, o webhook liga a assinatura
e o acesso é liberado. Não revela se o e-mail já existe (responde ok sempre).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Usuario

router = APIRouter(prefix="/api", tags=["cadastro"])


class Cadastro(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=3, max_length=200)


@router.post("/cadastro")
def cadastro(dados: Cadastro, db: Session = Depends(get_db)):
    email = dados.email.strip().lower()
    if "@" not in email:
        raise HTTPException(422, "E-mail inválido.")
    if not db.query(Usuario).filter(Usuario.email == email).first():
        db.add(Usuario(nome=dados.nome.strip()[:200], email=email, papel="equipe", assinatura_ativa=False))
        db.commit()
    return {"ok": True}
