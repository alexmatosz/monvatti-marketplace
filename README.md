# Monvatti Marketplace

Extensão do Chrome + backend próprio para estudar anúncios do Mercado Livre (vendas estimadas, ritmo, logística, taxas, calculadora de margem e planilha). Projeto independente, acesso por **login**. Pagamento (AbacatePay) e página de cadastro entram depois, sobre a mesma base.

## Estrutura

```
extensao/     cliente Chrome (manifest, background, content, popup, icones)
backend/      serviço FastAPI: login + estudo
  auth.py       login, token, criar usuário (admin)
  estudo.py     endpoints da extensão (versão, eu, estudo/planilha, anúncio/taxas/busca)
  pagamento.py  encaixe do AbacatePay (stub por ora)
  seed.py       cria os primeiros acessos
  _referencia_estudo_replique.py   código do estudo como estava no Replique (para portar o ML)
Marca/        logos e paleta (arquivos-fonte, não entram no pacote)
```

## Rodar o backend (dev)

```
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m backend.seed          # cria admin e chefe; mostra as senhas (anote)
uvicorn backend.main:app --reload --port 8000
```

Variáveis de ambiente úteis (opcionais): `MONVATTI_SECRET` (troque em produção), `MONVATTI_MODO_DEMO` (padrão `true`), `MONVATTI_DATABASE_URL` (padrão SQLite em `dados/`), `MONVATTI_ADMIN_SENHA` / `MONVATTI_CHEFE_SENHA` (senhas do seed).

## Instalar a extensão

1. `chrome://extensions` → ligue **Modo do desenvolvedor**.
2. **Carregar sem compactação** → escolha a pasta `extensao/`.
3. Clique no ícone da Monvatti, informe o endereço do servidor (ex.: `http://localhost:8000`), e-mail e senha, e **Entrar**. Aceite a permissão para o endereço.

## O que já funciona

- **Login** (email + senha → token), sessão, criar usuários (admin), e o encaixe de assinatura (`assinatura_ativa`) pronto para o AbacatePay.
- **Planilha do estudo** (`/api/extensao/estudo`): gera o `.xlsx` a partir dos itens que a extensão coletou na página.

## Passos do dev (precisam da conta de estudo do ML)

- **Dados do anúncio** (`/api/extensao/anuncio`, `/tarifas`, `/busca`): hoje respondem com uma mensagem pedindo para conectar a conta de estudo. O código original (que lê o Mercado Livre pela conta de estudo) está em `backend/_referencia_estudo_replique.py`; porte as chamadas para `backend/estudo.py`. Não dá para testar isso sem uma conta de estudo real do ML.
- **AbacatePay**: implemente `registrar_evento_abacatepay` em `backend/pagamento.py` (webhook liga/desliga `assinatura_ativa`). O resto do sistema já só pergunta `assinatura_valida`.

## Marca

- Logo: monograma Monvatti (triângulo invertido), gradiente azul.
- Cores: Chrysler Blue `#001AD8`, RISD Blue `#3145FF`, Gunmetal `#2B333B`, Black `#000000`, Platinum `#DFDCDB`.

## Regras

- Vendas estimadas e ritmo são aproximações a partir do número público ("+50 mil vendidos"); não são dados oficiais do Mercado Livre.
- O estudo usa uma conta do Mercado Livre de estudo (descartável), nunca a conta de um cliente real.
