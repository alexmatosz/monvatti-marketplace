// Roda só na página de retorno do OAuth do Mercado Livre (modo local, callback do
// Postman). Lê code + state do endereço e manda para o servidor Monvatti, para
// ninguém precisar copiar e colar o código. Em produção o ML volta direto para o
// servidor e esta página nem aparece.
(() => {
  const p = new URLSearchParams(location.search);
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state) return;

  const faixa = document.createElement("div");
  faixa.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:16px 20px;" +
    "font:600 15px/1.4 'Segoe UI',system-ui,sans-serif;color:#fff;background:#001AD8;text-align:center;box-shadow:0 4px 18px rgba(0,0,0,.25)";
  faixa.textContent = "Monvatti: conectando a sua conta do Mercado Livre…";
  document.documentElement.append(faixa);

  chrome.runtime.sendMessage({ tipo: "retornoML", code, state }, (r) => {
    if (r?.ok) {
      faixa.style.background = "#0f8a5f";
      const quem = r.dados?.apelido ? ` (${r.dados.apelido})` : "";
      faixa.textContent = `Monvatti: conta do Mercado Livre conectada${quem}. Esta aba fecha sozinha.`;
    } else {
      faixa.style.background = "#d4343b";
      faixa.textContent = `Monvatti: não consegui conectar sozinho (${r?.erro || "sem resposta da extensão"}). Copie o código desta página e cole na Monvatti.`;
    }
  });
})();
