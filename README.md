# Monvatti Marketplaces

Ferramenta de estudo de anúncios em marketplace: uma **extensão do Chrome** + **backend próprio** que mostram vendas estimadas, métricas, taxas e margem dentro da página do anúncio. Começa pelo **Mercado Livre**; **Shopee** e **Amazon** vêm depois. Acesso por e-mail; o pagamento (Pix) e a página de cadastro entram sobre a mesma base.

> **Nome:** a ferramenta é o **Monvatti Marketplaces**. A **Monvatti** é a consultoria que opera mais de 150 clientes e da qual a ferramenta nasceu.

Este README é o **único documento de contexto** do projeto. Se você vai colaborar, comece por aqui.

---

## Estrutura do repositório

```
extensao/     cliente Chrome MV3 (manifest, background, content, popup, ícones)
backend/      serviço FastAPI: login + estudo do Mercado Livre
  auth.py         login, token, criar usuário
  estudo.py       endpoints da extensão (eu, estudo/planilha, anúncio, tarifas, busca, tendência, ranqueamento)
  estudo_ml.py    lógica do estudo (portada do Replique)
  ml.py           cliente da API do ML por usuário
  ml_conta.py     vincular/desvincular a conta do ML (OAuth)
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
3. Clique no ícone da Monvatti, informe o endereço do servidor (`http://localhost:8000`), o e-mail (`alexmonvatti@gmail.com`) e **Entrar**. Aceite a permissão.

**O que dá para testar agora:** login por e-mail e a planilha do estudo na busca do ML. As métricas/taxas/frete dentro do anúncio só funcionam depois de **vincular uma conta do Mercado Livre** (ver abaixo); até lá essas telas pedem a vinculação — é esperado.

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

---

## Criar o app do Mercado Livre (uma vez)

O estudo lê a API do ML por OAuth, então o servidor precisa de **um app do Mercado Livre**. É um passo único, seu (não de cada usuário).

> **Crie um app PRÓPRIO, separado do app do Replique.** O app do Replique é o que os clientes reais autorizaram; o app da extensão faz estudo com conta descartável. Separar protege as contas dos clientes.

1. Acesse **developers.mercadolivre.com.br** e entre com a **conta de estudo** (descartável), nunca a de um cliente. Vá em **Minhas aplicações → Criar aplicação**.
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

### Vincular a conta pela extensão

Cada usuário vincula a **própria** conta do ML, e isso libera o estudo só para ele.

1. No popup (logado), clique em **Vincular minha conta do Mercado Livre** e autorize na aba que abre.
2. **Modo local (callback do Postman):** o ML mostra um **código**; cole no campo do popup e **Confirmar vínculo**.
   **Modo hospedado (HTTPS):** o ML volta sozinho e o popup já mostra "Conta vinculada".
3. Desvincular a qualquer momento pelo popup.

> Vincular libera as leituras autenticadas (taxas, frete, vendedor). Alguns dados de terceiros (visitas, data de criação) o ML não entrega por essa via — o estudo contorna com avaliações/perguntas, como no Replique.

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
