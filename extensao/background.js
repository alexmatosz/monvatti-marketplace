// Endereço do servidor Monvatti. O pacote da Chrome Web Store sai com o endereço
// de produção (o empacotar.ps1 troca esta linha); o cliente nunca digita isso.
const SERVIDOR = "https://monvatti-api.vercel.app"; // para testar com o servidor local, troque por http://localhost:8000

const PADRAO = { token: "", chave: "", imposto: 7, email: "" };

function novaChave() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function configuracao() {
  const c = await chrome.storage.local.get(PADRAO);
  c.servidor = SERVIDOR;
  if (!c.chave) {
    c.chave = novaChave();
    await chrome.storage.local.set({ chave: c.chave });
  }
  return c;
}

async function contaML() {
  try {
    const c = await chrome.cookies.get({ url: "https://www.mercadolivre.com.br/", name: "orguseridp" });
    return (c?.value || "").replace(/\D/g, "");
  } catch {
    return "";
  }
}

async function chamar(caminho, { metodo = "GET", corpo, semToken = false } = {}) {
  const c = await configuracao();
  if (!semToken && !c.token) throw new Error("Faça login na extensão: clique no ícone da Monvatti.");
  const headers = { "Content-Type": "application/json", "X-Extensao-Chave": c.chave };
  if (!semToken) headers.Authorization = "Bearer " + c.token;
  let r;
  try {
    r = await fetch(c.servidor + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch (e) {
    throw new Error(`Não consegui falar com o servidor Monvatti (${c.servidor}: ${e?.message || e}). Confira sua internet e tente de novo.`);
  }
  const dados = await r.json().catch(() => ({}));
  if (r.status === 401 && !semToken) await chrome.storage.local.set({ token: "" });
  if (!r.ok) throw new Error(typeof dados.detail === "string" ? dados.detail : "O servidor Monvatti recusou o pedido (" + r.status + ").");
  return dados;
}

async function versaoNoServidor() {
  const { servidor } = await configuracao();
  try {
    const r = await fetch(servidor + "/api/extensao/versao", { cache: "no-store" });
    return r.ok ? (await r.json()).versao || "" : "";
  } catch {
    return "";
  }
}

async function detalheDaPagina(itemId) {
  try {
    const r = await fetch(`https://produto.mercadolivre.com.br/MLB-${itemId.slice(3)}`, { credentials: "include" });
    if (!r.ok || /account-verification/.test(r.url)) return null;
    const padroes = {
      vendedor_id: /"seller_id"\s*:\s*(\d+)/, tipo: /"listing_type_id"\s*:\s*"([a-z_]+)"/,
      categoria_id: /"category_id"\s*:\s*"(MLB\d+)"/,
    };
    const achados = {};
    const leitor = r.body.getReader();
    const decodificador = new TextDecoder();
    let html = "";
    let primeiraLogistica = -1;
    while (html.length < 400000) {
      const { done, value } = await leitor.read();
      if (done) break;
      html += decodificador.decode(value, { stream: true });
      for (const [k, re] of Object.entries(padroes)) if (!achados[k]) achados[k] = (html.match(re) || [])[1] || "";
      if (primeiraLogistica < 0) primeiraLogistica = html.search(/"logistic_type"\s*:/);
      if (Object.keys(padroes).every((k) => achados[k]) && primeiraLogistica >= 0 && html.length > primeiraLogistica + 60000) break;
    }
    leitor.cancel().catch(() => {});
    const trecho = primeiraLogistica >= 0 ? html.slice(primeiraLogistica, primeiraLogistica + 60000) : "";
    achados.logisticas = [...new Set([...trecho.matchAll(/"logistic_type"\s*:\s*"([a-z_]+)"/g)].map((m) => m[1]))];
    return achados;
  } catch {
    return null;
  }
}

// Posição de um anúncio na busca do Mercado Livre, lida na própria página de busca
// (com a sessão da pessoa). A API de busca do ML não é liberada para apps de terceiros.
function slugDaBusca(termo) {
  return termo.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function posicaoNaBusca({ termo, item_id, produto_id = "", paginas = 3 }) {
  const slug = slugDaBusca(termo || "");
  const alvo = String(item_id || "").replace(/\D/g, "");
  const prod = String(produto_id || "").replace(/\D/g, "");
  if (!slug) throw new Error("Informe uma palavra-chave.");
  if (!alvo && !prod) throw new Error("Informe o código do anúncio (MLB…).");
  const padroes = [alvo && new RegExp(`MLB-?${alvo}(?!\\d)`), prod && new RegExp(`/p/MLB${prod}(?!\\d)`)].filter(Boolean);
  let antes = 0;
  let total = null;
  for (let p = 0; p < paginas; p++) {
    const url = `https://lista.mercadolivre.com.br/${slug}${p ? `_Desde_${antes + 1}_NoIndex_True` : ""}`;
    let r;
    try {
      r = await fetch(url, { credentials: "include" });
    } catch {
      throw new Error("Não consegui abrir a busca do Mercado Livre. Confira sua internet.");
    }
    if (/account-verification|login/.test(r.url)) throw new Error("O Mercado Livre pediu verificação. Abra o mercadolivre.com.br, entre na sua conta e tente de novo.");
    if (!r.ok) break;
    const html = await r.text();
    if (total == null) {
      const m = html.match(/([\d.]+)\s+resultados/);
      total = m ? parseInt(m[1].replace(/\./g, ""), 10) : null;
    }
    let cartoes = html.split("ui-search-layout__item").slice(1);
    if (!cartoes.length) cartoes = html.split(/class="poly-card[\s"]/).slice(1);
    if (!cartoes.length) break;
    const i = cartoes.findIndex((c) => padroes.some((re) => re.test(c)));
    if (i >= 0) return { termo, item_id, posicao: antes + i + 1, pagina: p + 1, limite: antes + cartoes.length, total, url };
    antes += cartoes.length;
  }
  return { termo, item_id, posicao: null, pagina: null, limite: antes, total };
}

async function marcarRadar(itens) {
  const { radar_visto } = await chrome.storage.local.get({ radar_visto: 0 });
  const n = (itens || []).filter((x) => x.mudou_em && Date.parse(x.mudou_em) > radar_visto).length;
  await chrome.action.setBadgeBackgroundColor({ color: "#1F3BFF" });
  await chrome.action.setBadgeText({ text: n ? String(n) : "" });
}

// Confere preço (servidor, API do ML) e posição na busca (aqui) de tudo que está no radar.
async function verificarRadar() {
  const c = await configuracao();
  if (!c.token) return { itens: [] };
  const { itens = [] } = await chamar("/api/extensao/radar");
  if (!itens.length) {
    await marcarRadar([]);
    return { itens };
  }
  const posicoes = {};
  for (const x of itens) {
    if (!x.termo) continue;
    try {
      const p = await posicaoNaBusca({ termo: x.termo, item_id: x.item_id, produto_id: x.produto_id, paginas: 2 });
      posicoes[x.item_id] = p.posicao || 0;
    } catch {
      // Sem a posição desta vez; o preço ainda é conferido.
    }
  }
  const r = await chamar("/api/extensao/radar/atualizar", { metodo: "POST", corpo: { posicoes } });
  await chrome.storage.local.set({ radar_conferido: Date.now() });
  await marcarRadar(r.itens);
  return r;
}

const agendarRadar = () => chrome.alarms.create("radar", { delayInMinutes: 2, periodInMinutes: 360 });
chrome.runtime.onInstalled.addListener(agendarRadar);
chrome.runtime.onStartup.addListener(agendarRadar);
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "radar") verificarRadar().catch(() => {});
});

const acoes = {
  async detalhes({ ids }) {
    const saida = {};
    const fila = [...new Set(ids)].slice(0, 100);
    const trabalhar = async () => {
      while (fila.length) {
        const id = fila.shift();
        saida[id] = await detalheDaPagina(id);
      }
    };
    await Promise.all(Array.from({ length: 12 }, trabalhar));
    return saida;
  },
  async estudo({ pesquisa, filtro, imposto, itens }) {
    const c = await configuracao();
    if (!c.servidor || !c.token) throw new Error("Faça login na extensão: clique no ícone da Monvatti.");
    let r;
    try {
      r = await fetch(c.servidor + "/api/extensao/estudo", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Extensao-Chave": c.chave, Authorization: "Bearer " + c.token },
        body: JSON.stringify({ pesquisa, filtro, imposto, itens }),
      });
    } catch (e) {
      throw new Error(`Não consegui falar com o servidor Monvatti (${c.servidor}: ${e?.message || e}). Confira sua internet e tente de novo.`);
    }
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(typeof d.detail === "string" ? d.detail : "O servidor Monvatti não gerou a planilha (" + r.status + ").");
    }
    const bytes = new Uint8Array(await r.arrayBuffer());
    let binario = "";
    for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    const nome = (r.headers.get("Content-Disposition") || "").match(/filename="([^"]+)"/)?.[1] || "estudo.xlsx";
    return { nome, base64: btoa(binario) };
  },
  async conferirVersao() {
    const atual = await versaoNoServidor();
    if (!atual) return { recarregar: false };
    const { versao } = await chrome.storage.session.get({ versao: "" });
    if (!versao) {
      await chrome.storage.session.set({ versao: atual });
      return { recarregar: false };
    }
    if (versao === atual) return { recarregar: false };
    setTimeout(() => chrome.runtime.reload(), 150);
    return { recarregar: true };
  },
  async estado() {
    const c = await configuracao();
    if (!c.servidor || !c.token) return { ligado: false, servidor: c.servidor, imposto: c.imposto };
    try {
      const eu = await chamar("/api/extensao/eu?conta_ml=" + encodeURIComponent(await contaML()));
      return { ligado: true, servidor: c.servidor, imposto: c.imposto, ...eu };
    } catch (err) {
      // Sessão encerrada (ex.: a mesma conta entrou em outro computador): volta para a tela de entrar.
      const { token } = await chrome.storage.local.get({ token: "" });
      if (!token) return { ligado: false, servidor: c.servidor, imposto: c.imposto, motivo: err.message };
      throw err;
    }
  },
  async anuncio({ pagina }) {
    return chamar("/api/extensao/anuncio", { metodo: "POST", corpo: { conta_ml: await contaML(), pagina } });
  },
  async tarifas({ preco, categoria_id, tipo_anuncio, vendedor_id, item_id }) {
    return chamar("/api/extensao/tarifas", { metodo: "POST", corpo: { conta_ml: await contaML(), preco, categoria_id, tipo: tipo_anuncio, vendedor_id, item_id } });
  },
  async busca({ itens, lote = 0 }) {
    return chamar("/api/extensao/busca", { metodo: "POST", corpo: { conta_ml: await contaML(), itens, lote } });
  },
  async tendencia({ termo, categoria_id }) {
    return chamar("/api/extensao/tendencia", { metodo: "POST", corpo: { termo, categoria_id } });
  },
  async ranqueamento({ termo, item_id, produto_id }) {
    return posicaoNaBusca({ termo, item_id, produto_id });
  },
  async metricas({ item_id }) {
    return chamar("/api/extensao/metricas", { metodo: "POST", corpo: { item_id } });
  },
  async radarListar() {
    const r = await chamar("/api/extensao/radar");
    const { radar_conferido } = await chrome.storage.local.get({ radar_conferido: 0 });
    return { ...r, conferido: radar_conferido };
  },
  async radarAdicionar({ item }) {
    return chamar("/api/extensao/radar", { metodo: "POST", corpo: item });
  },
  async radarRemover({ item_id }) {
    return chamar("/api/extensao/radar/" + encodeURIComponent(item_id), { metodo: "DELETE" });
  },
  async radarVerificar() {
    const r = await verificarRadar();
    return { ...r, conferido: Date.now() };
  },
  async radarVisto() {
    await chrome.storage.local.set({ radar_visto: Date.now() });
    await chrome.action.setBadgeText({ text: "" });
    return {};
  },
  async pedirCodigo({ email }) {
    await chrome.storage.local.set({ email });
    const r = await chamar("/api/auth/codigo", { metodo: "POST", corpo: { email }, semToken: true });
    // Grava aqui (e não na janelinha): ela fecha quando a pessoa vai ao e-mail, antes da resposta chegar.
    await chrome.storage.local.set({ codigo_pedido: Date.now() });
    return r;
  },
  async entrar({ email, codigo }) {
    const dados = await chamar("/api/auth/login", { metodo: "POST", corpo: { email, codigo }, semToken: true });
    await chrome.storage.local.set({ token: dados.token, email });
    await chrome.storage.local.remove("codigo_pedido");
    return { ligado: true, usuario: dados.usuario };
  },
  async conectarML() {
    const { url, state, manual } = await chamar("/api/ml/conectar");
    await chrome.storage.local.set({ ml_state: state || "" });
    await chrome.tabs.create({ url });
    return { manual: !!manual };
  },
  async colarCodigoML({ code }) {
    const { ml_state } = await chrome.storage.local.get({ ml_state: "" });
    if (!ml_state) throw new Error("Clique em Vincular antes de colar o código.");
    const r = await chamar("/api/ml/colar", { metodo: "POST", corpo: { code, state: ml_state } });
    await chrome.storage.local.remove("ml_state");
    return r;
  },
  async situacaoML() {
    return chamar("/api/ml/situacao");
  },
  async desconectarML() {
    await chrome.storage.local.remove("ml_state");
    return chamar("/api/ml/desconectar", { metodo: "POST" });
  },
  async publico() {
    const { servidor } = await configuracao();
    try {
      const r = await fetch(servidor + "/api/extensao/versao", { cache: "no-store" });
      return r.ok ? await r.json() : {};
    } catch {
      return {};
    }
  },
  async codigoPendente() {
    const { email, codigo_pedido } = await chrome.storage.local.get({ email: "", codigo_pedido: 0 });
    return { email, pendente: !!email && Date.now() - codigo_pedido < 15 * 60 * 1000 };
  },
  async desligar() {
    await chrome.storage.local.set({ token: "" });
    return { ligado: false };
  },
  async imposto({ valor }) {
    await chrome.storage.local.set({ imposto: valor });
    return { imposto: valor };
  },
};

chrome.runtime.onMessage.addListener((msg, _remetente, responder) => {
  const acao = acoes[msg?.tipo];
  if (!acao) return false;
  acao(msg).then((dados) => responder({ ok: true, dados })).catch((e) => responder({ ok: false, erro: e.message }));
  return true;
});
