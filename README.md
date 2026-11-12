# Monvatti Marketplaces

Ferramenta de estudo de anúncios em marketplace: uma **extensão do Chrome** + **backend próprio** que mostram vendas estimadas, métricas, taxas e margem dentro da página do anúncio. Funciona **sozinha**, sem depender de nenhum outro sistema. Começa pelo **Mercado Livre**; **Shopee** e **Amazon** vêm depois. Acesso por e-mail; o pagamento (Pix) e a página de cadastro entram sobre a mesma base.

> **Nome:** a ferramenta é o **Monvatti Marketplaces**. A **Monvatti** é a consultoria que opera mais de 150 clientes e da qual a ferramenta nasceu.

Este README é o **único documento de contexto** do projeto. Se você vai colaborar, comece por aqui.

---

## Estrutura do repositório

```
extensao/     cliente Chrome MV3 (manifest, background, content, popup, ícones)
backend/      serviço FastAPI: login + estudo do Mercado Livre
  auth.py         login, token, criar usuário
  estudo.py       endpoints da extensão (eu, estudo/planilha, anúncio, tarifas, busca, tendência, ranqueamento)
  estudo_ml.py    lógica do estudo (vendas estimadas, taxas, frete, tendência, ranqueamento)
  ml.py           cliente da API do ML por usuário
  ml_conta.py     conectar o ML: convite da landing, conta própria pelo popup, conta central (admin)
  cadastro.py     POST /api/cadastro público (usuário pendente)
  pagamento.py    encaixe do Pix/AbacatePay (stub por ora)
  seed.py         cria o primeiro acesso
landing/      site de marketing + cadastro (Next.js + Tailwind)
Marca/        logos e paleta (arquivos-fonte, não entram no pacote)
requirements.txt
```

---

## Teste rápido (ver rodando)

São duas partes: o **servidor** (uma janela de comando aberta) e a **extensão** (no Chrome).

**1) Ligar o servidor** (precisa de Python 3.11+ com "Add Python to PATH"):

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m backend.seed            # cria o acesso e mostra a senha (anote)
uvicorn backend.main:app --port 8000
```

A última linha deixa a janela escrevendo logs — é assim mesmo, deixe aberta. O servidor fica em `http://localhost:8000`.

**2) Instalar a extensão no Chrome:**

1. Abra `chrome://extensions` e ligue o **Modo do desenvolvedor**.
2. **Carregar sem compactação** → escolha a pasta `extensao/`.
3. Clique no ícone da Monvatti, informe o e-mail (`alexmonvatti@gmail.com`) e **Receber código por e-mail**. Digite o código de 6 dígitos e **Entrar**. O endereço do servidor é fixo na extensão (`SERVIDOR_PADRAO` em `extensao/background.js`); para testar outro servidor, use **Avançado** no popup.
   - Sem SMTP configurado, o código aparece no log do servidor e, com `MONVATTI_MODO_DEMO=true`, o popup já preenche sozinho. Em produção (`MONVATTI_MODO_DEMO=false`) sem SMTP, o login fica bloqueado.

**O que dá para testar agora:** login por código, a planilha do estudo na busca do ML e a aba **Estudos** (monte um estudo juntando anúncios de páginas e buscas diferentes: **+ Adicionar ao estudo** no anúncio, **+ Estudo** em cada cartão da busca ou **+ Juntar ao estudo** no topo; a planilha sai na aba Estudos da gaveta). As métricas/taxas/frete dentro do anúncio só funcionam depois de **conectar uma conta do Mercado Livre** (a do cliente ou a central; ver abaixo); até lá essas telas pedem a conexão — é esperado.

---

## Backend (dev)

Variáveis de ambiente (todas opcionais no dev):

| Variável | O que é | Padrão |
|---|---|---|
| `MONVATTI_SECRET` | assina tokens/estado (troque em produção) | aleatório |
| `MONVATTI_MODO_DEMO` | modo demonstração | `true` |
| `MONVATTI_DATABASE_URL` | banco | SQLite em `dados/` |
| `MONVATTI_USUARIO_EMAIL` | e-mail do seed | `alexmonvatti@gmail.com` |
| `ML_CLIENT_ID` / `ML_CLIENT_SECRET` / `ML_REDIRECT_URI` | app do Mercado Livre (ver abaixo) | — |
| `MONVATTI_LANDING_URL` | para onde o cliente volta depois de conectar o ML | `http://localhost:3000` |
| `SMTP_HOST` / `SMTP_PORTA` / `SMTP_USUARIO` / `SMTP_SENHA` / `SMTP_REMETENTE` | envio do código de login por e-mail | — (código vai para o log) |

**Cache do Mercado Livre:** o servidor guarda em memória as respostas que mudam pouco e são iguais para todos (taxas, vendedor e frete por 24 h, anúncio/perguntas/catálogo de 6 h a 7 dias, avaliação mais antiga por 7 dias). Estudar de novo os mesmos anúncios quase não chama o ML. O cache zera quando o servidor reinicia.

---

## Criar o app do Mercado Livre (uma vez)

O estudo lê a API do ML por OAuth, então o servidor precisa de **um app do Mercado Livre**. É um passo único, seu (não de cada usuário).

> **Crie um app PRÓPRIO para a extensão**, separado do app que os clientes da consultoria já autorizaram. Os clientes da extensão vão autorizar este app (só leitura); se um dia o ML suspender o app da extensão, as integrações da consultoria não são afetadas.

1. Acesse **developers.mercadolivre.com.br** e entre com uma conta **da Monvatti** (dona do app), nunca a de um cliente. Vá em **Minhas aplicações → Criar aplicação**.
2. Preencha:
   - **Nome:** `Monvatti Marketplaces`.
   - **Redirect URI:** o ML **não aceita `localhost`**.
     - Testar na sua máquina: `https://oauth.pstmn.io/v1/callback`
     - Hospedado (HTTPS): `https://SEU-DOMINIO/api/ml/callback`
     - O valor tem que ser **idêntico** ao `ML_REDIRECT_URI` do servidor (dá para trocar depois).
   - **Escopos:** `read` e `offline_access`. **Não** marque `write` — o estudo só lê.
3. Salve. O ML mostra o **App ID** (= `ML_CLIENT_ID`) e a **Secret Key** (= `ML_CLIENT_SECRET`).
4. Informe as chaves na mesma janela antes de subir o servidor:

   ```
   set ML_CLIENT_ID=o-app-id
   set ML_CLIENT_SECRET=a-secret-key
   set ML_REDIRECT_URI=https://oauth.pstmn.io/v1/callback
   uvicorn backend.main:app --port 8000
   ```

   (No PowerShell: `$env:ML_CLIENT_ID = "..."`. Ao hospedar, troque o `ML_REDIRECT_URI` pelo `https://SEU-DOMINIO/api/ml/callback` e ajuste o mesmo valor no cadastro do app.)

### Como o cliente conecta o Mercado Livre

Cada cliente autoriza o app do ML com a **própria** conta (só leitura), como era no Replique. Assim ninguém divide conta: 100 clientes são 100 autorizações, e se uma cair só aquele cliente é afetado.

1. **Na landing, logo após o cadastro** (depois, após o pagamento): o cadastro devolve um **convite** assinado (7 dias) e a landing mostra o **Passo 2 — Conectar ao Mercado Livre**. O cliente autoriza na tela oficial do ML.
   - **Hospedado (HTTPS):** o ML volta para `/api/ml/callback`, que guarda o token e manda o cliente para `/conectado` na landing (`MONVATTI_LANDING_URL`).
   - **Local (callback do Postman):** o ML mostra um **código**; o cliente cola na própria landing.
   - O link `/conectar?convite=...` faz o mesmo passo (para mandar por e-mail).
2. **Pelo popup da extensão**, para quem pulou o passo: **Conectar minha conta do Mercado Livre**. Dá para desconectar a qualquer momento.

**Conta de estudo central (reserva, só admin):** o admin (`papel = "admin"`, o `seed` já cria assim) vê no popup **Vincular a conta de estudo central**. Ela só é usada por quem ainda não conectou a própria conta. O estudo usa nesta ordem: conta do cliente → conta central → pede para conectar.

> O token do ML é renovado sozinho; uma trava garante uma renovação por vez (o refresh token do ML só vale uma vez). Por isso o servidor deve rodar com **um** processo (`uvicorn` sem `--workers`).

> Vincular libera as leituras autenticadas (taxas, frete, vendedor). Alguns dados de terceiros (visitas, data de criação) o ML não entrega por essa via — o estudo contorna com avaliações/perguntas.

---

## Landing page (`landing/`)

Site de marketing + cadastro, em **Next.js** (App Router) + Tailwind, com a marca Monvatti. Páginas: home, `/sobre`, `/marketplaces` (e por canal), `/novidades` (blog) e `/suporte`.

```
cd landing
npm install
npm run dev       # http://localhost:3000
```

O cadastro chama `POST /api/cadastro` no backend (cria usuário **pendente**, sem assinatura). Defina o endereço do backend em `NEXT_PUBLIC_API_URL` (dev: `http://localhost:8000`; produção: a URL hospedada). Os valores dos planos são de exemplo, a confirmar.

### Hospedar a landing na Vercel

A landing é um **subdiretório** (`landing/`), então o ajuste importante é **Root Directory = `landing`**.

1. Entre em https://vercel.com e faça login **com o GitHub** (`alexmatosz`).
2. **Add New… → Project** → importe `alexmatosz/monvatti-marketplace` (se não aparecer, **Adjust GitHub App Permissions**).
3. Em **Root Directory** clique **Edit** e selecione **`landing`**. O **Framework** detecta **Next.js** sozinho; o resto fica no padrão.
4. **Deploy** → sai uma URL `https://<nome>.vercel.app`. A partir daí, **todo push na `main` publica sozinho**.
5. Quando o backend tiver URL HTTPS, defina `NEXT_PUBLIC_API_URL` em **Project → Settings → Environment Variables** e refaça o deploy.

Pela linha de comando (precisa de login interativo seu): `npm i -g vercel`, `vercel login`, depois `vercel --prod` a partir de `landing/`.

---

## Pagamento (próximo passo)

Implemente o webhook em `backend/pagamento.py` (liga/desliga `assinatura_ativa`); o resto do sistema já só pergunta `assinatura_valida`. Pix via AbacatePay. O nome do provedor **não aparece** no site público.

---

## Marca

- Logo: monograma Monvatti (triângulo invertido), gradiente azul. Use os arquivos reais em `Marca/` — nunca recriar à mão.
- Cores: Chrysler Blue `#001AD8`, RISD Blue `#3145FF`, Gunmetal `#2B333B`, Platinum `#DFDCDB`, amarelo ML `#FFE600`.

## Regras

- Vendas estimadas e ritmo são aproximações a partir do número público ("+50 mil vendidos"); não são dados oficiais do marketplace.
- O estudo usa uma conta do Mercado Livre de **estudo** (descartável), nunca a conta de um cliente real; nunca altera preços de anúncios.
- Segredos (`.env`, chaves do ML, banco) **não** entram no Git — cada pessoa tem o seu.

## Colaborar

Trabalho em equipe é pelo GitHub: ninguém trabalha direto na `main` — crie um branch, faça o commit e abra um **Pull Request** para revisar e juntar. Antes de começar, `git pull`.
