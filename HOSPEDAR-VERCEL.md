# Hospedar a landing na Vercel

A landing (Next.js) está na pasta `landing/` do repositório `alexmatosz/monvatti-marketplace`.
Por ser um subdiretório, o único ajuste importante é definir o **Root Directory = `landing`**.

## Caminho recomendado — pelo painel (sem terminal, ~3 min)

1. Entre em https://vercel.com e faça login **com o GitHub** (a conta `alexmatosz`).
2. **Add New… → Project**.
3. Em **Import Git Repository**, escolha `alexmatosz/monvatti-marketplace`.
   - Se o repositório não aparecer, clique em **Adjust GitHub App Permissions** e autorize o acesso a ele.
4. Na tela de configuração:
   - **Root Directory**: clique em **Edit** e selecione a pasta **`landing`**.
   - **Framework Preset**: deve detectar **Next.js** sozinho.
   - **Build Command** e **Output**: deixe no padrão (a Vercel cuida).
5. **Deploy**. Em ~1 min sai uma URL `https://<nome>.vercel.app`.
6. A partir daí, **todo push na branch `main` publica sozinho**.

## Variável de ambiente (quando o backend estiver no ar)

O formulário de cadastro envia para `NEXT_PUBLIC_API_URL`. Enquanto o backend não estiver hospedado,
as páginas funcionam normalmente, mas o envio do cadastro ainda não grava.

Quando a API tiver uma URL HTTPS, em **Project → Settings → Environment Variables**:

- `NEXT_PUBLIC_API_URL = https://<url-da-api>`

e refaça o deploy (Deployments → Redeploy).

## Alternativa — pela linha de comando

Precisa de login interativo (por isso rode você, com o prefixo `!` na sessão):

```
! npm i -g vercel
! vercel login
```

Depois eu consigo rodar o deploy a partir de `landing/` (`vercel --prod`) com a sessão já autenticada.

## Domínio próprio (opcional, depois)

Em **Project → Settings → Domains**, dá para apontar um domínio da Monvatti (ex.: `app.monvatti.com.br`).
