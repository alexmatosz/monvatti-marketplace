"""Modelos do banco.

Hoje só precisamos de usuários (login) com o encaixe de assinatura para o
pagamento (AbacatePay) que vem depois. Quando o estudo guardar leituras do ML,
é aqui que entra a tabela de leituras.
"""

from datetime import datetime, timezone

from datetime import date

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from backend.db import Base


def agora() -> datetime:
    return datetime.now(timezone.utc)


class ContaML(Base):
    """A conta do Mercado Livre que um usuário vinculou (OAuth). Uma por usuário:
    cada um conecta a sua e libera o estudo só para si (como no Avant). As
    credenciais (access_token, refresh_token, obtido_em, expires_in, user_id)
    ficam em `credenciais`; o estudo lê a API do ML por essa conta."""

    __tablename__ = "conta_ml"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, unique=True, index=True, nullable=True)
    credenciais: Mapped[dict] = mapped_column(JSON, default=dict)
    apelido: Mapped[str] = mapped_column(String(120), default="")
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


class LeituraEstudo(Base):
    """O que a extensão viu num anúncio num dia (vendidos, preço, visitas). Uma
    linha por anúncio por dia: é daqui que sai o histórico do estudo."""

    __tablename__ = "leituras_estudo"
    __table_args__ = (UniqueConstraint("item_id", "dia"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    item_id: Mapped[str] = mapped_column(String(40), index=True)
    produto_id: Mapped[str] = mapped_column(String(40), default="")
    titulo: Mapped[str] = mapped_column(String(300), default="")
    dia: Mapped[date] = mapped_column(Date)
    vendidos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vendidos_texto: Mapped[str] = mapped_column(String(40), default="")
    preco: Mapped[float | None] = mapped_column(Float, nullable=True)
    visitas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    patrocinado: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    dados: Mapped[dict] = mapped_column(JSON, default=dict)
    lida_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


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


class CodigoLogin(Base):
    """Código de 6 dígitos mandado por e-mail para entrar na extensão. Só o hash
    fica guardado; um código novo substitui o anterior do mesmo e-mail."""

    __tablename__ = "codigos_login"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), index=True)
    codigo_hash: Mapped[str] = mapped_column(String(100))
    vence_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    tentativas: Mapped[int] = mapped_column(Integer, default=0)
    usado: Mapped[bool] = mapped_column(Boolean, default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)


class Pagamento(Base):
    """Uma cobrança Pix criada no AbacatePay. Quando o webhook confirma, libera
    os dias do plano ao usuário (uma vez só por cobrança)."""

    __tablename__ = "pagamentos"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(Integer, index=True)
    checkout_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    url: Mapped[str] = mapped_column(String(500), default="")
    valor_centavos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    plano: Mapped[str] = mapped_column(String(20), default="mensal")
    dias: Mapped[int] = mapped_column(Integer, default=30)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    liberado_ate: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)
    pago_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class RadarItem(Base):
    """Anúncio que a pessoa pôs no radar: a extensão confere de tempos em tempos o
    preço (pela API do ML) e a posição na busca (lida no navegador da pessoa) e
    mostra quando subiu ou caiu."""

    __tablename__ = "radar_itens"
    __table_args__ = (UniqueConstraint("usuario_id", "item_id"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(Integer, index=True)
    item_id: Mapped[str] = mapped_column(String(40))
    produto_id: Mapped[str] = mapped_column(String(40), default="")
    titulo: Mapped[str] = mapped_column(String(300), default="")
    thumbnail: Mapped[str] = mapped_column(String(400), default="")
    permalink: Mapped[str] = mapped_column(String(400), default="")
    termo: Mapped[str] = mapped_column(String(120), default="")
    preco_inicial: Mapped[float | None] = mapped_column(Float, nullable=True)
    preco_anterior: Mapped[float | None] = mapped_column(Float, nullable=True)
    preco_atual: Mapped[float | None] = mapped_column(Float, nullable=True)
    posicao_inicial: Mapped[int | None] = mapped_column(Integer, nullable=True)
    posicao_anterior: Mapped[int | None] = mapped_column(Integer, nullable=True)
    posicao_atual: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=agora)
    verificado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    mudou_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
