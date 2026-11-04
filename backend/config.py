"""Configuração do backend do Monvatti Marketplace.

Tudo por variável de ambiente, com padrões bons para rodar na máquina do dev.
Para produção, defina ao menos MONVATTI_SECRET e MONVATTI_MODO_DEMO=false.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("MONVATTI_DATA_DIR", BASE_DIR / "dados"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("MONVATTI_DATABASE_URL", f"sqlite:///{DATA_DIR / 'monvatti.db'}")

SECRET = os.getenv("MONVATTI_SECRET", "troque-este-segredo-em-producao")

MODO_DEMONSTACAO = os.getenv("MONVATTI_MODO_DEMO", "true").lower() in ("1", "true", "sim", "yes")

IMPOSTO_PADRAO = float(os.getenv("MONVATTI_IMPOSTO_PADRAO", "7"))

VERSAO_EXTENSAO = os.getenv("MONVATTI_VERSAO_EXTENSAO", "0.2.0")

TOKEN_VALIDADE_DIAS = int(os.getenv("MONVATTI_TOKEN_DIAS", "30"))

ML_SITE_ID = "MLB"

ML_CLIENT_ID = os.getenv("ML_CLIENT_ID", "")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET", "")
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "http://localhost:8000/api/ml/callback")
