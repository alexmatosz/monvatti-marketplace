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
