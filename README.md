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

- **Login só por e-mail** → token; usuário inicial já pago (`seed`); encaixe de assinatura (`assinatura_ativa`) pronto para o AbacatePay.
- **Planilha do estudo** (`/api/extensao/estudo`): gera o `.xlsx` a partir dos itens coletados na página.
- **Tendência por categoria** (`/api/extensao/tendencia`) e **Ranqueamento do anúncio** (`/api/extensao/ranqueamento`): mais vendidos de uma categoria (via `/highlights` do ML) e a posição de um anúncio na busca para uma palavra-chave. Aparecem como abas na gaveta da extensão. Dependem da conta do ML vinculada (503 sem ela).
- **Estudo do anúncio** (`/api/extensao/anuncio`, `/tarifas`, `/busca`): métricas, taxas, frete e vendedor pela conta do ML que **cada usuário vincula** (portado do Replique em `backend/estudo_ml.py` + cliente `backend/ml.py`). Sem a conta vinculada, respondem 503 pedindo a vinculação.

## Vincular a conta do Mercado Livre (como no Avant)

Cada usuário vincula a **própria** conta do ML pela extensão, e isso libera o estudo só para ele. Para isso funcionar, o servidor precisa de um app do Mercado Livre cadastrado (uma vez):

1. Crie um app **próprio** no Mercado Livre (developers.mercadolivre.com.br), separado do app do Replique — isola a atividade de estudo das contas reais dos clientes. Defina no ambiente: `ML_CLIENT_ID`, `ML_CLIENT_SECRET` e `ML_REDIRECT_URI`.
2. O Mercado Livre **não aceita `localhost`** como redirect. Duas formas:
   - **Hospedado (HTTPS):** `ML_REDIRECT_URI = https://seu-dominio/api/ml/callback` (igual no cadastro do app). Aí o fluxo é automático: o usuário clica em **Vincular minha conta do Mercado Livre** no popup, autoriza e o ML volta em `/api/ml/callback`, que guarda o token daquele usuário (quem é vem assinado no `state`). O popup passa a mostrar "Conta vinculada".
   - **Local/dev:** use o callback do Postman (`https://oauth.pstmn.io/v1/callback`, padrão). Ao clicar em **Vincular**, o popup abre a autorização e mostra um campo para **colar o código** que o Mercado Livre exibe; cole e clique em **Confirmar vínculo** (`POST /api/ml/colar`). É o mesmo truque do Replique, para dar para testar o estudo antes de hospedar.
3. Desvincular a qualquer momento (`POST /api/ml/desconectar`).

Passo a passo de criar o app do ML (onde criar, o que preencher, onde pôr as chaves): veja **`CRIAR-APP-MERCADO-LIVRE.md`**.

> Observação: vincular a conta libera as leituras autenticadas (taxas, frete, vendedor). Alguns dados de anúncios de terceiros (visitas, data de criação) o próprio ML não entrega por essa via — o estudo contorna com avaliações/perguntas, igual no Replique.

> O código de referência original do Replique ficou em `backend/_referencia_estudo_replique.py` (só consulta).

## Landing page (`landing/`)

Site de marketing + cadastro, em **Next.js** (App Router) + Tailwind, com a marca Monvatti.

```
cd landing
npm install
npm run dev     # http://localhost:3000
```

O formulário de cadastro chama `POST /api/cadastro` no backend (cria um usuário
**pendente**, sem assinatura — só libera quando o pagamento entrar). Defina o
endereço do backend em `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:8000` no
dev; a URL hospedada em produção). Os valores dos planos são de exemplo, a
confirmar; o pagamento (AbacatePay) entra na próxima fase.

## AbacatePay (próximo passo)

Implemente `registrar_evento_abacatepay` em `backend/pagamento.py` (o webhook liga/desliga `assinatura_ativa`). O resto do sistema já só pergunta `assinatura_valida`.

## Marca

- Logo: monograma Monvatti (triângulo invertido), gradiente azul.
- Cores: Chrysler Blue `#001AD8`, RISD Blue `#3145FF`, Gunmetal `#2B333B`, Black `#000000`, Platinum `#DFDCDB`.

## Regras

- Vendas estimadas e ritmo são aproximações a partir do número público ("+50 mil vendidos"); não são dados oficiais do Mercado Livre.
- O estudo usa uma conta do Mercado Livre de estudo (descartável), nunca a conta de um cliente real.
