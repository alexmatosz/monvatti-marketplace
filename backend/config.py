"""Configuração do backend do Monvatti Marketplace.

Tudo por variável de ambiente, com padrões bons para rodar na máquina do dev.
Em produção (Vercel), veja a lista completa no README ("Hospedar o backend").
"""

import os
from pathlib import Path


def _env(nome: str, padrao: str = "") -> str:
    return os.getenv(nome, padrao).strip()


EM_PRODUCAO = bool(_env("VERCEL")) or _env("MONVATTI_PRODUCAO").lower() in ("1", "true", "sim")

BASE_DIR = Path(__file__).resolve().parent.parent
# Na Vercel o disco é somente leitura (só /tmp grava); o banco de lá é o Postgres.
DATA_DIR = Path(_env("MONVATTI_DATA_DIR") or ("/tmp/monvatti" if EM_PRODUCAO else BASE_DIR / "dados"))
DATA_DIR.mkdir(parents=True, exist_ok=True)


def _url_do_banco() -> str:
    url = _env("MONVATTI_DATABASE_URL") or _env("DATABASE_URL") or _env("POSTGRES_URL")
    if not url:
        return f"sqlite:///{DATA_DIR / 'monvatti.db'}"
    # A Neon/Vercel entregam "postgres://"; o SQLAlchemy quer o driver explícito.
    for prefixo in ("postgres://", "postgresql://"):
        if url.startswith(prefixo):
            return "postgresql+psycopg://" + url[len(prefixo):]
    return url


DATABASE_URL = _url_do_banco()

SECRET = _env("MONVATTI_SECRET", "troque-este-segredo-em-producao")
if EM_PRODUCAO and (SECRET == "troque-este-segredo-em-producao" or len(SECRET) < 32):
    raise RuntimeError("Defina MONVATTI_SECRET (32+ caracteres aleatórios) nas variáveis de ambiente da Vercel.")

MODO_DEMONSTACAO = _env("MONVATTI_MODO_DEMO", "false" if EM_PRODUCAO else "true").lower() in ("1", "true", "sim", "yes")

IMPOSTO_PADRAO = float(_env("MONVATTI_IMPOSTO_PADRAO", "7"))

VERSAO_EXTENSAO = _env("MONVATTI_VERSAO_EXTENSAO", "0.5.0")

# Sessão longa: o código por e-mail só é pedido de novo quando ela vence.
TOKEN_VALIDADE_DIAS = int(_env("MONVATTI_TOKEN_DIAS", "90"))

# Endereços públicos.
PUBLIC_URL = _env("MONVATTI_PUBLIC_URL", "http://localhost:8000").rstrip("/")   # este backend
LANDING_URL = _env("MONVATTI_LANDING_URL", "http://localhost:3000").rstrip("/")  # site de vendas
LINK_EXTENSAO = _env("MONVATTI_LINK_EXTENSAO", "")  # página da extensão na Chrome Web Store
EMAIL_SUPORTE = _env("MONVATTI_EMAIL_SUPORTE", "alexmonvatti@gmail.com")

# Código de login por e-mail.
CODIGO_MINUTOS = int(_env("MONVATTI_CODIGO_MINUTOS", "15"))
CODIGO_TENTATIVAS = 5

# Envio de e-mail (SMTP). Funciona com Gmail (senha de app) ou Resend (smtp.resend.com).
# Sem SMTP_HOST, o código vai só para o log do servidor (bom para testar na máquina).
SMTP_HOST = _env("SMTP_HOST")
SMTP_PORTA = int(_env("SMTP_PORTA", "587"))
SMTP_USUARIO = _env("SMTP_USUARIO")
SMTP_SENHA = _env("SMTP_SENHA")
EMAIL_REMETENTE = _env("EMAIL_REMETENTE") or (f"Monvatti Marketplace <{SMTP_USUARIO}>" if SMTP_USUARIO else "")

# Pagamento (AbacatePay: Pix ou cartão). Cada pagamento confirmado libera os dias do plano comprado.
ABACATEPAY_API_KEY = _env("ABACATEPAY_API_KEY")
ABACATEPAY_WEBHOOK_SECRET = _env("ABACATEPAY_WEBHOOK_SECRET")


def _centavos(nome: str, padrao: int) -> int:
    try:
        return int(_env(nome, str(padrao)))
    except ValueError:
        return padrao


# Planos à venda: preço cheio (cartão), em centavos, dias liberados e parcelas máximas no cartão.
# O Pix sai com DESCONTO_PIX % a menos. Os produtos são criados sozinhos no AbacatePay
# (um por plano, forma de pagamento e preço), então mudar o preço aqui basta.
PLANOS = {
    "mensal": {"centavos": _centavos("PRECO_MENSAL", 4990), "dias": 30, "parcelas": 1, "nome": "Mensal"},
    "semestral": {"centavos": _centavos("PRECO_SEMESTRAL", 26940), "dias": 183, "parcelas": 6, "nome": "Semestral"},
    "anual": {"centavos": _centavos("PRECO_ANUAL", 47880), "dias": 365, "parcelas": 12, "nome": "Anual"},
}
DESCONTO_PIX = float(_env("DESCONTO_PIX", "10"))  # em %

# Modo de teste da compra: enquanto não há chave do AbacatePay, a landing oferece
# "continuar mesmo assim" e libera DIAS_TESTE dias sem cobrança (uma vez por e-mail).
# Desliga sozinho quando ABACATEPAY_API_KEY é cadastrada.
PAGAMENTO_TESTE = (_env("MONVATTI_PAGAMENTO_TESTE").lower() in ("1", "true", "sim")) and not ABACATEPAY_API_KEY
DIAS_TESTE = _centavos("MONVATTI_DIAS_TESTE", 7)


def preco(plano: str, metodo: str) -> int:
    """Preço em centavos do plano na forma de pagamento ("pix" ou "cartao")."""
    cheio = PLANOS[plano]["centavos"]
    if metodo != "pix":
        return cheio
    return int(cheio * (1 - DESCONTO_PIX / 100)) // 10 * 10  # arredonda para baixo nos 10 centavos

ML_SITE_ID = "MLB"

ML_CLIENT_ID = _env("ML_CLIENT_ID")
ML_CLIENT_SECRET = _env("ML_CLIENT_SECRET")
ML_REDIRECT_URI = _env("ML_REDIRECT_URI", "https://oauth.pstmn.io/v1/callback")
