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
    $("#servidor").value = e.servidor || "";
    const { email, motivo_saida } = await chrome.storage.local.get({ email: "", motivo_saida: "" });
    if (email && !$("#email").value) $("#email").value = email;
    if (motivo_saida && $("#msg").hidden) aviso(motivo_saida, "erro");
    return;
  }
  $("#quem").textContent = `Logado como ${e.nome}.`;
  const propria = !!e.ml_propria;
  const central = !!e.ml_central;
  $("#ml").className = "caixa" + (propria ? " ok" : central ? "" : " erro");
  $("#ml").textContent = propria
    ? `Sua conta do Mercado Livre está conectada${e.ml_apelido ? ` (${e.ml_apelido})` : ""}. Estudo liberado.`
    : central
      ? "Estudo liberado pela conexão da Monvatti. Conecte a sua conta do Mercado Livre para não depender dela."
      : "Conecte a sua conta do Mercado Livre para liberar o estudo. É só leitura: a Monvatti não altera nada na sua conta.";
  $("#conectar-ml").hidden = propria;
  $("#desconectar-ml").hidden = !propria;
  const { ml_state, ml_state_central } = await chrome.storage.local.get({ ml_state: "", ml_state_central: "" });
  $("#ml-manual").hidden = propria || !ml_state;
  $("#central-bloco").hidden = !e.admin;
  if (e.admin) {
    $("#central").className = "caixa" + (central ? " ok" : "");
    $("#central").textContent = central
      ? `Admin · conta de estudo central vinculada${e.ml_central_apelido ? ` (${e.ml_central_apelido})` : ""}. É a reserva de quem ainda não conectou a própria conta.`
      : "Admin · nenhuma conta de estudo central. Clientes sem conta própria conectada ficam sem estudo.";
    $("#conectar-central").hidden = central;
    $("#desconectar-central").hidden = !central;
    $("#central-manual").hidden = central || !ml_state_central;
  }
  const conta = e.conta && e.conta.conta;
  $("#conta").className = "caixa";
  $("#conta").textContent = conta && conta !== "deslogado"
    ? `Conta do Mercado Livre detectada neste navegador: ${conta}.`
    : "Mercado Livre deslogado neste navegador.";
  $("#imposto").value = e.imposto;
}

function passoCodigo(mostrar) {
  $("#passo-email").hidden = mostrar;
  $("#passo-codigo").hidden = !mostrar;
  if (mostrar) setTimeout(() => $("#codigo").focus(), 50);
}

async function pedirCodigo() {
  const email = $("#email").value.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return aviso("Informe o e-mail do seu cadastro.", "erro");
  const botao = $("#pedir-codigo");
  botao.disabled = true;
  try {
    const r = await enviar({ tipo: "pedirCodigo", email });
    await chrome.storage.local.set({ email });
    $("#codigo-para").textContent = `Mandamos o código para ${email}. Ele vale ${r.validade_min || 10} minutos.`;
    passoCodigo(true);
    if (r.codigo_teste) {
      $("#codigo").value = r.codigo_teste;
      aviso(`Servidor de teste, sem e-mail configurado: o código ${r.codigo_teste} já foi preenchido.`);
    } else {
      aviso("Confira a caixa de entrada (e o spam).", "ok");
    }
  } catch (err) {
    aviso(err.message, "erro");
  } finally {
    botao.disabled = false;
  }
}

$("#pedir-codigo").onclick = pedirCodigo;
$("#email").onkeydown = (ev) => ev.key === "Enter" && pedirCodigo();
$("#reenviar").onclick = pedirCodigo;
$("#trocar-email").onclick = () => { aviso(""); passoCodigo(false); };

async function entrar() {
  const email = $("#email").value.trim().toLowerCase();
  const codigo = $("#codigo").value.replace(/\D/g, "");
  if (codigo.length !== 6) return aviso("O código tem 6 números.", "erro");
  try {
    await enviar({ tipo: "entrar", email, codigo });
    $("#codigo").value = "";
    passoCodigo(false);
    await desenhar();
    aviso("Pronto! Abra um anúncio no Mercado Livre.", "ok");
  } catch (err) {
    aviso(err.message, "erro");
  }
}
$("#entrar").onclick = entrar;
$("#codigo").onkeydown = (ev) => ev.key === "Enter" && entrar();

$("#salvar-servidor").onclick = async () => {
  const servidor = $("#servidor").value.trim().replace(/\/+$/, "");
  if (servidor && !/^https?:\/\/[^/]+$/.test(servidor)) return aviso("Endereço inválido. Ex.: http://localhost:8000", "erro");
  if (servidor) {
    const destino = new URL(servidor);
    const permitido = await chrome.permissions.request({ origins: [`${destino.protocol}//${destino.hostname}/*`] });
    if (!permitido) return aviso("Sem a permissão a extensão não fala com esse servidor.", "erro");
  }
  const r = await enviar({ tipo: "servidor", servidor });
  $("#servidor").value = r.servidor;
  aviso(`Servidor: ${r.servidor}. Entre de novo.`, "ok");
};

function ligarConexao({ central }) {
  const p = central ? "central" : "ml";
  $(`#conectar-${p}`).onclick = async () => {
    try {
      const { manual } = await enviar({ tipo: "conectarML", central });
      if (manual) {
        $(`#${p}-manual`).hidden = false;
        aviso(`Abri o Mercado Livre numa aba. Autorize com ${central ? "a conta de ESTUDO" : "a sua conta"}: a conexão termina sozinha e a aba fecha. Reabra esta janela para ver. (Se não terminar, cole o código aqui embaixo.)`, "ok");
      } else {
        aviso("Abri o Mercado Livre numa aba. Autorize e depois reabra esta janela.", "ok");
      }
    } catch (err) {
      aviso(err.message, "erro");
    }
  };
  $(`#confirmar-${p}`).onclick = async () => {
    const code = $(`#${p}-code`).value.trim();
    if (!code) return aviso("Cole o código que o Mercado Livre mostrou.", "erro");
    try {
      await enviar({ tipo: "colarCodigoML", code, central });
      $(`#${p}-code`).value = "";
      await desenhar();
      aviso(central ? "Conta de estudo central vinculada." : "Conta do Mercado Livre conectada. Estudo liberado!", "ok");
    } catch (err) {
      aviso(err.message, "erro");
    }
  };
  $(`#desconectar-${p}`).onclick = async () => {
    try {
      await enviar({ tipo: "desconectarML", central });
      await desenhar();
      aviso(central ? "Conta de estudo central desvinculada." : "Sua conta do Mercado Livre foi desconectada.", "ok");
    } catch (err) {
      aviso(err.message, "erro");
    }
  };
}
ligarConexao({ central: false });
ligarConexao({ central: true });

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
