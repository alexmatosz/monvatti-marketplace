"""Configuração do backend do Monvatti Marketplace.

Tudo por variável de ambiente, com padrões bons para rodar na máquina do dev.
Para produção, defina ao menos MONVATTI_SECRET e MONVATTI_MODO_DEMO=false.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _carregar_env(arquivo: Path) -> None:
    """Lê CHAVE=valor do .env da raiz (sem dependência). O que já estiver no
    ambiente tem prioridade. O .env não vai para o Git."""
    if not arquivo.is_file():
        return
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        os.environ.setdefault(chave.strip(), valor.strip().strip('"').strip("'"))


_carregar_env(BASE_DIR / ".env")
DATA_DIR = Path(os.getenv("MONVATTI_DATA_DIR", BASE_DIR / "dados"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("MONVATTI_DATABASE_URL", f"sqlite:///{DATA_DIR / 'monvatti.db'}")

SECRET = os.getenv("MONVATTI_SECRET", "troque-este-segredo-em-producao")

MODO_DEMONSTACAO = os.getenv("MONVATTI_MODO_DEMO", "true").lower() in ("1", "true", "sim", "yes")

IMPOSTO_PADRAO = float(os.getenv("MONVATTI_IMPOSTO_PADRAO", "7"))

VERSAO_EXTENSAO = os.getenv("MONVATTI_VERSAO_EXTENSAO", "0.3.0")

# Sessão longa: o cliente só digita código de novo se outro navegador entrar na conta.
TOKEN_VALIDADE_DIAS = int(os.getenv("MONVATTI_TOKEN_DIAS", "365"))

ML_SITE_ID = "MLB"

ML_CLIENT_ID = os.getenv("ML_CLIENT_ID", "")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET", "")
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "https://oauth.pstmn.io/v1/callback")

# Para onde o retorno do ML manda o cliente depois de conectar (página "conectado" da landing).
LANDING_URL = os.getenv("MONVATTI_LANDING_URL", "http://localhost:3000").rstrip("/")

# Envio do código de login por e-mail (SMTP). Sem SMTP_HOST, o código sai no log
# do servidor e, no modo demonstração, volta na resposta (só para testar local).
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORTA = int(os.getenv("SMTP_PORTA", "587"))
SMTP_USUARIO = os.getenv("SMTP_USUARIO", "")
SMTP_SENHA = os.getenv("SMTP_SENHA", "")
SMTP_REMETENTE = os.getenv("SMTP_REMETENTE", "Monvatti Marketplace <nao-responda@monvatti.com.br>")
