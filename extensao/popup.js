const $ = (s) => document.querySelector(s);

function enviar(msg) {
  return new Promise((ok, falha) => chrome.runtime.sendMessage(msg, (r) => (r?.ok ? ok(r.dados) : falha(new Error(r?.erro || "Falha na extensão.")))));
}

function aviso(texto, tipo = "") {
  const m = $("#msg");
  m.hidden = !texto;
  m.textContent = texto || "";
  m.className = "caixa " + tipo;
}

async function desenhar() {
  aviso("");
  let e;
  try {
    e = await enviar({ tipo: "estado" });
  } catch (err) {
    e = { ligado: false };
    aviso(err.message, "erro");
  }
  $("#desligada").hidden = e.ligado;
  $("#ligada").hidden = !e.ligado;
  if (!e.ligado) {
    const { servidor } = await chrome.storage.local.get({ servidor: "" });
    $("#servidor").value = servidor;
    return;
  }
  $("#quem").textContent = `Logado como ${e.nome}.`;
  const conta = e.conta && e.conta.conta;
  $("#conta").className = "caixa";
  $("#conta").textContent = conta && conta !== "deslogado"
    ? `Conta do Mercado Livre detectada neste navegador: ${conta}.`
    : "Mercado Livre deslogado neste navegador.";
  $("#imposto").value = e.imposto;
}

$("#entrar").onclick = async () => {
  const servidor = $("#servidor").value.trim().replace(/\/+$/, "");
  const email = $("#email").value.trim();
  if (!/^https?:\/\/[^/]+$/.test(servidor)) return aviso("Informe o endereço do servidor, por exemplo https://app.monvatti.com.br", "erro");
  if (!email) return aviso("Informe o seu e-mail.", "erro");
  const destino = new URL(servidor);
  const permitido = await chrome.permissions.request({ origins: [`${destino.protocol}//${destino.hostname}/*`] });
  if (!permitido) return aviso("Sem a permissão a extensão não fala com o servidor.", "erro");
  try {
    await enviar({ tipo: "entrar", servidor, email });
    await desenhar();
    aviso("Login feito. Abra um anúncio no Mercado Livre.", "ok");
  } catch (err) {
    aviso(err.message, "erro");
  }
};

$("#salvar-imposto").onclick = async () => {
  const valor = Math.min(Math.max(parseFloat($("#imposto").value) || 0, 0), 100);
  await enviar({ tipo: "imposto", valor });
  aviso("Imposto salvo. Recarregue a página do anúncio.", "ok");
};

$("#desligar").onclick = async () => {
  await enviar({ tipo: "desligar" });
  await desenhar();
};

desenhar();
