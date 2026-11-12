"""Banco de dados (SQLAlchemy + SQLite por padrão)."""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from backend import config

_sqlite = config.DATABASE_URL.startswith("sqlite")
engine = create_engine(
    config.DATABASE_URL,
    connect_args={"check_same_thread": False} if _sqlite else {},
    pool_pre_ping=True,
)

if _sqlite:
    @event.listens_for(engine, "connect")
    def _pragmas(conexao, _registro):
        cur = conexao.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA busy_timeout=15000")
        cur.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import models  # noqa: F401
    Base.metadata.create_all(engine)
    _garantir_admin()


def _garantir_admin():
    """Em produção não dá para rodar o seed na mão: MONVATTI_ADMIN_EMAIL cria (uma
    vez) o administrador, que tem acesso sem vencimento e vincula a conta central
    do Mercado Livre pela extensão."""
    import os

    from backend.models import Usuario
    email = os.getenv("MONVATTI_ADMIN_EMAIL", "").strip().lower()
    if not email:
        return
    with SessionLocal() as db:
        u = db.query(Usuario).filter(Usuario.email == email).first()
        if not u:
            db.add(Usuario(nome="Monvatti", email=email, papel="admin", assinatura_ativa=True))
        elif u.papel != "admin" or not u.assinatura_ativa:
            u.papel, u.assinatura_ativa, u.ativo = "admin", True, True
        else:
            return
        db.commit()
