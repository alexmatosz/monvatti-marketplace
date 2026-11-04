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
  const mlConectado = !!e.ml_conectado;
  $("#ml").className = "caixa" + (mlConectado ? " ok" : "");
  $("#ml").textContent = mlConectado
    ? `Conta do Mercado Livre vinculada${e.ml_apelido ? ` (${e.ml_apelido})` : ""}. Estudo liberado.`
    : "Vincule a sua conta do Mercado Livre para liberar o estudo de anúncios.";
  $("#conectar-ml").hidden = mlConectado;
  $("#desconectar-ml").hidden = !mlConectado;
  const { ml_state } = await chrome.storage.local.get({ ml_state: "" });
  $("#ml-manual").hidden = mlConectado || !ml_state;
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

$("#conectar-ml").onclick = async () => {
  try {
    const { manual } = await enviar({ tipo: "conectarML" });
    if (manual) {
      $("#ml-manual").hidden = false;
      aviso("Abri o Mercado Livre numa aba. Autorize com a sua conta, copie o código que aparecer e cole aqui embaixo.", "ok");
    } else {
      aviso("Abri o Mercado Livre numa aba. Autorize e depois reabra esta janela.", "ok");
    }
  } catch (err) {
    aviso(err.message, "erro");
  }
};

$("#confirmar-ml").onclick = async () => {
  const code = $("#ml-code").value.trim();
  if (!code) return aviso("Cole o código que o Mercado Livre mostrou.", "erro");
  try {
    await enviar({ tipo: "colarCodigoML", code });
    $("#ml-code").value = "";
    await desenhar();
    aviso("Conta do Mercado Livre vinculada!", "ok");
  } catch (err) {
    aviso(err.message, "erro");
  }
};

$("#desconectar-ml").onclick = async () => {
  try {
    await enviar({ tipo: "desconectarML" });
    await desenhar();
    aviso("Conta do Mercado Livre desvinculada.", "ok");
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
