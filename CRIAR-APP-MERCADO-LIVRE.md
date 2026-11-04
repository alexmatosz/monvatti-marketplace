# Criar o app do Mercado Livre (uma vez)

O estudo lê a API do Mercado Livre por OAuth. Para isso o servidor precisa de **um app do Mercado Livre**. É um passo único, seu (não de cada usuário). Depois de criado, cada pessoa vincula a conta dela pela extensão.

> **Crie um app PRÓPRIO, separado do app do Replique.** O app do Replique é o que os clientes reais autorizaram com as contas de venda deles; o app da extensão faz estudo de concorrente com conta descartável. Separar isola os dois e protege as contas dos clientes.

## 1. Entrar no painel de desenvolvedor

1. Acesse **developers.mercadolivre.com.br**.
2. Entre com a conta do Mercado Livre que vai ser dona do app — de preferência a **conta de estudo** (descartável) ou uma conta de desenvolvedor da Monvatti. Nunca a conta de um cliente.
3. Vá em **Minhas aplicações → Criar aplicação**.

## 2. Preencher o cadastro

- **Nome / Nome curto:** algo como `Monvatti Marketplace`.
- **Descrição:** estudo de anúncios (vendas estimadas, taxas, frete).
- **URI de redirect (Redirect URI):** o Mercado Livre **não aceita `localhost`**. Use conforme a fase:
  - **Agora (testar na sua máquina):** `https://oauth.pstmn.io/v1/callback`
  - **Depois (hospedado em HTTPS):** `https://SEU-DOMINIO/api/ml/callback`

  Dá para trocar esse campo depois, quando for hospedar. O valor aqui tem que ser **idêntico** ao `ML_REDIRECT_URI` do servidor.
- **Escopos (permissões):** marque **`read`** e **`offline_access`** (o `offline_access` é o que dá o token de renovação, para não precisar reconectar toda hora). **Não** precisa de `write` — o estudo só lê, nunca altera anúncios.
- **Tópicos / notificações:** pode deixar em branco.

Salve. O Mercado Livre mostra o **App ID** (um número) e a **Secret Key**.
- **App ID** = `ML_CLIENT_ID`
- **Secret Key** = `ML_CLIENT_SECRET`

## 3. Informar as chaves ao servidor

Antes de subir o servidor, defina as variáveis **na mesma janela de comando** e rode o `uvicorn` ali:

```
set ML_CLIENT_ID=o-app-id-aqui
set ML_CLIENT_SECRET=a-secret-key-aqui
set ML_REDIRECT_URI=https://oauth.pstmn.io/v1/callback
uvicorn backend.main:app --port 8000
```

(No PowerShell é `$env:ML_CLIENT_ID = "..."`. Quando hospedar, troque o `ML_REDIRECT_URI` pelo `https://SEU-DOMINIO/api/ml/callback` e ajuste o mesmo valor no cadastro do app.)

## 4. Vincular a conta pela extensão

1. No popup da extensão, logado, clique em **Vincular minha conta do Mercado Livre**.
2. Abre a autorização do ML numa aba. Autorize com a conta desejada (a de estudo).
3. **Modo local (callback do Postman):** o ML mostra um **código**; copie e cole no campo que aparece no popup, em **Confirmar vínculo**.
   **Modo hospedado (HTTPS):** não precisa colar nada — o ML volta sozinho e o popup já mostra "Conta vinculada".
4. Pronto: o estudo de anúncios fica liberado para aquele usuário.

## Resumo das variáveis

| Variável | O que é | Exemplo |
|---|---|---|
| `ML_CLIENT_ID` | App ID do app do ML | `1234567890123456` |
| `ML_CLIENT_SECRET` | Secret Key do app do ML | `abc...` |
| `ML_REDIRECT_URI` | Callback (igual no cadastro do app) | local: `https://oauth.pstmn.io/v1/callback` · hospedado: `https://SEU-DOMINIO/api/ml/callback` |
