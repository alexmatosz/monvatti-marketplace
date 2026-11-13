# Monvatti Marketplaces

Ferramenta de estudo de anúncios em marketplace: uma **extensão do Chrome** + **backend próprio** que mostram vendas estimadas, métricas, taxas e margem dentro da página do anúncio. Começa pelo **Mercado Livre**; **Shopee** e **Amazon** vêm depois. Compra por Pix na landing; acesso na extensão só com o e-mail e um código.

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
  pagamento.py    Pix (AbacatePay): checkout, webhook e regra de acesso
  email_envio.py  e-mail do código de login e de boas-vindas (SMTP)
  seed.py         cria o primeiro acesso (dev)
api/index.py    entrada do backend na Vercel (+ vercel.json)
empacotar.ps1   gera o .zip da extensão para a Chrome Web Store
iniciar.ps1     sobe o backend local lendo o .env
landing/      site de marketing + cadastro (Next.js + Tailwind)
Marca/        logos e paleta (arquivos-fonte, não entram no pacote)
requirements.txt
```

---

## Como funciona para o cliente

1. Na landing, escolhe o plano (mensal, semestral ou anual), informa nome e e-mail e paga por **Pix**.
2. O AbacatePay avisa o servidor (webhook), que libera os dias do plano e manda um e-mail com o link da extensão.
3. Instala a extensão pela **Chrome Web Store**, clica no ícone e digita **só o e-mail**. Chega um **código de 6 números** por e-mail; cola na extensão e pronto. A sessão dura 90 dias; depois disso pede o código de novo.
4. Para renovar, paga de novo na landing com o mesmo e-mail: os dias se somam.

O estudo usa a **conta central de estudo do Mercado Livre** da Monvatti, vinculada uma vez pelo administrador. O cliente não vincula nada. (O vínculo da conta de cada cliente fica para uma etapa futura.)

---

## Teste rápido (na sua máquina)

**1) Ligar o servidor** (Python 3.11+):

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m backend.seed            # cria o administrador (alexmonvatti@gmail.com)
.\iniciar.ps1                     # sobe em http://localhost:8000 lendo as chaves do .env
```

Deixe a janela aberta. Sem SMTP configurado, **o código de login aparece nessa janela** (procure por "Seu código para entrar").

**2) Extensão:** `chrome://extensions` → **Modo do desenvolvedor** → **Carregar sem compactação** → pasta `extensao/`. Na versão de desenvolvimento ela fala com `http://localhost:8000` (constante `SERVIDOR` no topo de `background.js`).

**3) Entrar:** ícone da Monvatti → e-mail → **Receber código** → cole o código da janela do servidor.

**4) Conta central do ML (administrador):** logado como admin, o popup mostra **Vincular a conta de estudo do Mercado Livre**. Modo local: o ML mostra um código (callback do Postman); cole no popup. Hospedado: volta sozinho.

> Subir a versão em `extensao/manifest.json` **e** `MONVATTI_VERSAO_EXTENSAO` (backend/config.py) faz a extensão de desenvolvimento se recarregar sozinha na próxima página do ML.

---

## Criar o app do Mercado Livre (uma vez)

> **Crie um app PRÓPRIO, separado do app do Replique.** Separar protege as contas dos clientes do Replique.

1. **developers.mercadolivre.com.br** com a **conta de estudo** (descartável) → **Minhas aplicações → Criar aplicação**.
2. **Redirect URI** (o ML não aceita `localhost`): local `https://oauth.pstmn.io/v1/callback`; produção `https://SEU-BACKEND/api/ml/callback`. Tem que ser **idêntico** ao `ML_REDIRECT_URI` do servidor. Dá para cadastrar os dois.
3. **Escopos:** `read` e `offline_access` (sem `write`). **URL de notificações:** em branco, sem tópicos.
4. App ID = `ML_CLIENT_ID`, Secret Key = `ML_CLIENT_SECRET`.

> A API do ML bloqueia, para anúncios de terceiros, `/items`, `/visits`, `/prices` e `/sites/MLB/search` (403). Funcionam `/products/*`, `/highlights` e `/trends`. Por isso a data do anúncio é aproximada (catálogo, 1ª pergunta ou 1ª avaliação).

---

## Colocar no ar (produção)

São quatro peças. Os passos marcados **(você)** precisam da sua conta/login; o resto já está no código.

### 1. Banco e backend na Vercel

1. **(você)** Vercel → **Add New… → Project** → importe `alexmatosz/monvatti-marketplace` **de novo** (é um 2º projeto, separado da landing). **Root Directory = raiz do repositório** (não `landing`). Framework: **Other**. O `vercel.json` e `api/index.py` já fazem o resto.
2. **(você)** No projeto → **Storage → Create Database → Neon (Postgres)** → conecte ao projeto. Ela cria a variável `DATABASE_URL` sozinha.
3. **(você)** **Settings → Environment Variables**:

| Variável | Valor |
|---|---|
| `MONVATTI_SECRET` | 40+ caracteres aleatórios (gere com `python -c "import secrets;print(secrets.token_urlsafe(40))"`) |
| `MONVATTI_ADMIN_EMAIL` | `alexmonvatti@gmail.com` (cria o administrador sozinho) |
| `MONVATTI_PUBLIC_URL` | a URL deste backend, ex. `https://monvatti-api.vercel.app` |
| `MONVATTI_LANDING_URL` | a URL da landing |
| `MONVATTI_LINK_EXTENSAO` | link da extensão na Chrome Web Store (quando aprovada) |
| `MONVATTI_EMAIL_SUPORTE` | e-mail de suporte (vai no "responder" dos e-mails) |
| `ML_CLIENT_ID` / `ML_CLIENT_SECRET` | do app do ML |
| `ML_REDIRECT_URI` | `https://SEU-BACKEND/api/ml/callback` |
| `SMTP_HOST` / `SMTP_PORTA` / `SMTP_USUARIO` / `SMTP_SENHA` | envio de e-mail (ver abaixo) |
| `ABACATEPAY_API_KEY` / `ABACATEPAY_WEBHOOK_SECRET` | pagamento (ver abaixo) |

4. Deploy. Teste `https://SEU-BACKEND/api/ping`.

> O plano **Hobby** (grátis) da Vercel **não permite uso comercial**. Para testar serve; para vender, passe para o **Pro**. O código não muda.

### 2. E-mail (código de login e boas-vindas)

Mais simples, sem domínio próprio: **Gmail com senha de app**. Na conta Google (com verificação em 2 etapas) → **Segurança → Senhas de app** → gere uma. Depois:
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORTA=587`, `SMTP_USUARIO=seu@gmail.com`, `SMTP_SENHA=a-senha-de-app`. O Gmail aguenta ~500 e-mails/dia.
Com domínio próprio, troque por Resend (`smtp.resend.com`, porta 465, usuário `resend`, senha = API key).

### 3. Pagamento (AbacatePay)

1. **Produtos:** não precisa criar. O servidor cria sozinho no AbacatePay um produto por plano, forma de pagamento e preço (ex.: `monvatti-ml-anual-pix-43090`). Preços em `backend/config.py` (`PLANOS`, em centavos, ou variáveis `PRECO_MENSAL`/`PRECO_SEMESTRAL`/`PRECO_ANUAL`); desconto do Pix em `DESCONTO_PIX` (padrão 10%); parcelas máximas no cartão por plano (mensal 1x, semestral 6x, anual 12x). A landing lê os preços em `GET /api/pagamento/precos`.
2. **(você)** Crie uma **chave de API** (permissões de produto, checkout, cliente e leitura) → `ABACATEPAY_API_KEY`.
3. **(você)** Crie o **webhook**: URL `https://SEU-BACKEND/api/pagamento/webhook`, evento `checkout.completed`, um segredo à sua escolha → o mesmo valor em `ABACATEPAY_WEBHOOK_SECRET`.
4. Teste no **modo dev** do AbacatePay antes de ligar o modo real.

O servidor confere o segredo **e** confirma o status direto na API antes de liberar; cada cobrança libera uma vez só.

### 4. Landing na Vercel

Projeto com **Root Directory = `landing`** (ver abaixo) e as variáveis `NEXT_PUBLIC_API_URL` (URL do backend) e `NEXT_PUBLIC_LINK_EXTENSAO` (link da Web Store). Páginas novas: `/obrigado` (depois do Pix; confere sozinha se o pagamento caiu) e `/privacidade` (exigida pela Web Store).

### 5. Chrome Web Store

1. Gere o pacote apontando para o backend de produção: `.\empacotar.ps1 -Servidor https://SEU-BACKEND` → sai `dist\monvatti-marketplace-<versão>.zip`.
2. **(você)** https://chrome.google.com/webstore/devconsole → pague a taxa única (US$ 5) → **Novo item** → envie o zip.
3. Visibilidade **Não listada** (só quem tem o link acha). Política de privacidade: `https://SUA-LANDING/privacidade`.
4. Justificativas de permissão: **storage** (guardar o login), **cookies** (ler qual conta do ML está logada, só no domínio do Mercado Livre), **acesso a mercadolivre.com.br** (mostrar o painel nas páginas do ML).
5. Aprovada, copie o link para `MONVATTI_LINK_EXTENSAO` (backend) e `NEXT_PUBLIC_LINK_EXTENSAO` (landing).

Atualizações: suba a versão no `manifest.json`, rode o `empacotar.ps1` e envie o zip novo; o Chrome atualiza os clientes sozinho.

---

## Landing page (`landing/`)

Site de marketing + compra, em **Next.js** (App Router) + Tailwind. Páginas: home, `/sobre`, `/marketplaces` (e por canal), `/novidades`, `/suporte`, `/obrigado` e `/privacidade`.

```
cd landing
npm install
npm run dev       # http://localhost:3000
```

O formulário de compra chama `POST /api/pagamento/checkout` e redireciona para o Pix. Os valores mostrados nos planos (`components/Pricing.tsx` e `components/Signup.tsx`) têm que bater com os preços dos produtos no AbacatePay.

### Hospedar a landing na Vercel

1. Vercel → **Add New… → Project** → importe `alexmatosz/monvatti-marketplace`.
2. **Root Directory = `landing`**. Framework: Next.js (detecta sozinho).
3. Variáveis: `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_LINK_EXTENSAO`. **Deploy**. Todo push na `main` publica sozinho.

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
