"""Modelos do banco.

Hoje só precisamos de usuários (login) com o encaixe de assinatura para o
pagamento (AbacatePay) que vem depois. Quando o estudo guardar leituras do ML,
é aqui que entra a tabela de leituras.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base


def agora() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(Base):
    """Quem usa a extensão. O acesso é por login (email + senha)."""

    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    senha_hash: Mapped[str] = mapped_column(String(300), default="")
    papel: Mapped[str] = mapped_column(String(20), default="equipe")
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    sessao_versao: Mapped[int] = mapped_column(Integer, default=0)
    imposto_padrao: Mapped[float] = mapped_column(Float, default=7.0)
    assinatura_ativa: Mapped[bool] = mapped_column(Boolean, default=True)
    assinatura_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)
    ultimo_acesso_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
