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

function mostrar(secao) {
  for (const id of ["passo-email", "passo-codigo", "ligada"]) $("#" + id).hidden = id !== secao;
}

const ocupado = async (botao, tarefa) => {
  botao.disabled = true;
  try {
    await tarefa();
  } catch (err) {
    aviso(err.message, "erro");
  } finally {
    botao.disabled = false;
  }
};

async function desenhar() {
  let e;
  try {
    e = await enviar({ tipo: "estado" });
  } catch (err) {
    e = { ligado: false };
    aviso(err.message, "erro");
  }
  enviar({ tipo: "publico" }).then((p) => { if (p.landing) $("#link-compra").href = p.landing; }).catch(() => {});
  if (!e.ligado) {
    if (e.motivo) aviso(e.motivo, "erro");
    const { email, codigo_pedido } = await chrome.storage.local.get({ email: "", codigo_pedido: 0 });
    $("#email").value = email;
    // Se pediu um código há pouco (popup fechou para abrir o e-mail), volta direto para o passo do código.
    if (email && Date.now() - codigo_pedido < 15 * 60 * 1000) {
      $("#email-enviado").textContent = email;
      mostrar("passo-codigo");
      $("#codigo").focus();
    } else {
      mostrar("passo-email");
      $("#email").focus();
    }
    return;
  }
  mostrar("ligada");
  const ate = e.assinatura_ate ? new Date(e.assinatura_ate).toLocaleDateString("pt-BR") : "";
  $("#quem").textContent = `Conectado como ${e.nome}${ate ? ` · acesso até ${ate}` : ""}.`;
  $("#imposto").value = e.imposto;
  const admin = e.papel === "admin";
  $("#bloco-admin").hidden = false;
  const mlConectado = !!e.ml_propria;
  $("#titulo-ml").textContent = admin ? "Conta central de estudo (administrador)" : "Sua conta do Mercado Livre";
  $("#conectar-ml").textContent = admin ? "Vincular a conta de estudo do Mercado Livre" : "Conectar minha conta do Mercado Livre";
  $("#desconectar-ml").textContent = admin ? "Desvincular a conta de estudo" : "Desconectar minha conta do Mercado Livre";
  $("#ml").className = "caixa " + (mlConectado ? "ok" : e.ml_central ? "neutra" : "erro");
  $("#ml").textContent = admin
    ? (mlConectado
      ? `Conta de estudo vinculada${e.ml_apelido ? ` (${e.ml_apelido})` : ""}. É a reserva de quem não conectou a própria conta.`
      : "Nenhuma conta de estudo vinculada: clientes sem conta própria conectada ficam sem os dados.")
    : (mlConectado
      ? `Sua conta do Mercado Livre está conectada${e.ml_apelido ? ` (${e.ml_apelido})` : ""}. Estudo liberado.`
      : e.ml_central
        ? "Estudo liberado pela conta da Monvatti. Conecte a sua para não depender dela. É só leitura: nada muda na sua conta."
        : "Conecte a sua conta do Mercado Livre para liberar o estudo. É só leitura: a Monvatti não altera nada na sua conta.");
  $("#conectar-ml").hidden = mlConectado;
  $("#desconectar-ml").hidden = !mlConectado;
  const { ml_state } = await chrome.storage.local.get({ ml_state: "" });
  $("#ml-manual").hidden = mlConectado || !ml_state;
}

async function pedirCodigo(botao) {
  const email = $("#email").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return aviso("Digite um e-mail válido.", "erro");
  await ocupado(botao, async () => {
    const r = await enviar({ tipo: "pedirCodigo", email });
    $("#email-enviado").textContent = email;
    $("#codigo").value = "";
    mostrar("passo-codigo");
    $("#codigo").focus();
    aviso(`Código enviado. Ele vale por ${r.minutos || 15} minutos.`, "ok");
  });
}

$("#ja-tenho").onclick = async () => {
  const email = $("#email").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return aviso("Digite primeiro o e-mail para o qual o código foi enviado.", "erro");
  await chrome.storage.local.set({ email, codigo_pedido: Date.now() });
  aviso("");
  $("#email-enviado").textContent = email;
  $("#codigo").value = "";
  mostrar("passo-codigo");
  $("#codigo").focus();
};

$("#enviar-codigo").onclick = (e) => pedirCodigo(e.currentTarget);
$("#email").onkeydown = (e) => { if (e.key === "Enter") pedirCodigo($("#enviar-codigo")); };

async function entrar() {
  const codigo = $("#codigo").value.replace(/\D/g, "");
  if (codigo.length !== 6) return aviso("O código tem 6 números.", "erro");
  await ocupado($("#entrar"), async () => {
    const { email } = await chrome.storage.local.get({ email: "" });
    await enviar({ tipo: "entrar", email, codigo });
    await chrome.storage.local.remove("codigo_pedido");
    aviso("");
    await desenhar();
    aviso("Pronto! Abra uma busca ou um anúncio no Mercado Livre.", "ok");
  });
}

$("#entrar").onclick = entrar;
$("#codigo").oninput = (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
  if (e.target.value.length === 6) entrar();
};

$("#reenviar").onclick = async (e) => {
  const { email } = await chrome.storage.local.get({ email: "" });
  $("#email").value = email;
  pedirCodigo(e.currentTarget);
};

$("#trocar-email").onclick = async () => {
  await chrome.storage.local.remove("codigo_pedido");
  aviso("");
  mostrar("passo-email");
  $("#email").focus();
};

$("#conectar-ml").onclick = (e) => ocupado(e.currentTarget, async () => {
  const { manual } = await enviar({ tipo: "conectarML" });
  if (manual) {
    $("#ml-manual").hidden = false;
    aviso("Abri o Mercado Livre numa aba. Autorize e a conexão termina sozinha (a aba fecha). Reabra esta janela para ver. Se não terminar, cole aqui o código que aparecer.", "ok");
  } else {
    aviso("Abri o Mercado Livre numa aba. Autorize e depois reabra esta janela.", "ok");
  }
});

$("#confirmar-ml").onclick = (e) => ocupado(e.currentTarget, async () => {
  const code = $("#ml-code").value.trim();
  if (!code) return aviso("Cole o código que o Mercado Livre mostrou.", "erro");
  await enviar({ tipo: "colarCodigoML", code });
  $("#ml-code").value = "";
  await desenhar();
  aviso("Conta do Mercado Livre conectada!", "ok");
});

$("#desconectar-ml").onclick = (e) => ocupado(e.currentTarget, async () => {
  await enviar({ tipo: "desconectarML" });
  await desenhar();
  aviso("Conta do Mercado Livre desconectada.", "ok");
});

$("#salvar-imposto").onclick = async () => {
  const valor = Math.min(Math.max(parseFloat($("#imposto").value) || 0, 0), 100);
  await enviar({ tipo: "imposto", valor });
  aviso("Imposto salvo. Recarregue a página do anúncio.", "ok");
};

$("#desligar").onclick = async () => {
  await enviar({ tipo: "desligar" });
  aviso("");
  await desenhar();
};

desenhar();
