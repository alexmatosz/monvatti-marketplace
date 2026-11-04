const PADRAO = { servidor: "", token: "", chave: "", imposto: 7 };

function novaChave() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function configuracao() {
  const c = await chrome.storage.local.get(PADRAO);
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
  if (!c.servidor) throw new Error("Endereço do servidor Monvatti não configurado. Clique no ícone da extensão.");
  if (!semToken && !c.token) throw new Error("Faça login na extensão: clique no ícone da Monvatti.");
  const headers = { "Content-Type": "application/json", "X-Extensao-Chave": c.chave };
  if (!semToken) headers.Authorization = "Bearer " + c.token;
  let r;
  try {
    r = await fetch(c.servidor + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch {
    throw new Error("Não consegui falar com o servidor Monvatti. Confira o endereço e a internet.");
  }
  const dados = await r.json().catch(() => ({}));
  if (r.status === 401 && !semToken) await chrome.storage.local.set({ token: "" });
  if (!r.ok) throw new Error(typeof dados.detail === "string" ? dados.detail : "O servidor Monvatti recusou o pedido (" + r.status + ").");
  return dados;
}

async function versaoNoServidor() {
  const { servidor } = await configuracao();
  if (!servidor) return "";
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
    } catch {
      throw new Error("Não consegui falar com o servidor Monvatti. Confira o endereço e a internet.");
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
    const eu = await chamar("/api/extensao/eu?conta_ml=" + encodeURIComponent(await contaML()));
    return { ligado: true, servidor: c.servidor, imposto: c.imposto, ...eu };
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
  async copiar({ cliente_id, pagina }) {
    return chamar("/api/extensao/copiar", { metodo: "POST", corpo: { cliente_id, pagina } });
  },
  async salvarFotos({ pagina, cliente_id }) {
    return chamar("/api/extensao/fotos", { metodo: "POST", corpo: { pagina, cliente_id: cliente_id ?? null } });
  },
  async entrar({ servidor, email }) {
    await chrome.storage.local.set({ servidor });
    let r;
    try {
      r = await fetch(servidor + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      throw new Error("Não consegui falar com o servidor Monvatti. Confira o endereço e a internet.");
    }
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof dados.detail === "string" ? dados.detail : "Não consegui entrar (" + r.status + ").");
    await chrome.storage.local.set({ token: dados.token });
    return { ligado: true, usuario: dados.usuario };
  },
  async conectarML() {
    const { url } = await chamar("/api/ml/conectar");
    await chrome.tabs.create({ url });
    return { aberto: true };
  },
  async situacaoML() {
    return chamar("/api/ml/situacao");
  },
  async desconectarML() {
    return chamar("/api/ml/desconectar", { metodo: "POST" });
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
