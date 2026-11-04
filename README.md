# Monvatti Marketplace (extensão do Chrome)

Extensão da Monvatti para estudar anúncios do Mercado Livre: mostra as métricas de um anúncio (vendas estimadas, ritmo, logística, taxas), um resumo da busca e a calculadora de margem.

É um projeto independente, com backend próprio. O acesso é por **login** (cada pessoa com a sua conta). Pagamento (AbacatePay) e página de cadastro virão depois, sobre a mesma base.

## Estrutura

- `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js` — o cliente Chrome.
- `icones/` — ícones da extensão (gerados da marca).
- `Marca/` — logos e paleta da marca (arquivos-fonte, não entram no pacote da extensão).
- `backend/` — serviço próprio (login e dados do estudo). *(em construção)*

## Marca

- Logo: monograma Monvatti (triângulo invertido), gradiente azul.
- Cores: Chrysler Blue `#001AD8`, RISD Blue `#3145FF`, Gunmetal `#2B333B`, Black `#000000`, Platinum `#DFDCDB`.

## Instalar no navegador (teste)

1. No Chrome, abra `chrome://extensions` e ligue o **Modo do desenvolvedor**.
2. Clique em **Carregar sem compactação** e escolha esta pasta.
3. Clique no ícone da Monvatti, informe o endereço do servidor e faça login. Aceite a permissão para o endereço do servidor.

## Regras

- Vendas estimadas e ritmo são aproximações a partir do número público ("+50 mil vendidos"); não são dados oficiais do Mercado Livre.
- O estudo usa uma conta do Mercado Livre de estudo (descartável), nunca a conta de um cliente real.
