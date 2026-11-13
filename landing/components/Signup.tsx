"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Plano = "mensal" | "semestral" | "anual";
type Metodo = "pix" | "cartao";
type Estado = { tipo: "parado" | "enviando" | "erro"; msg?: string };
type Precos = {
  pagamento_disponivel?: boolean;
  modo_teste?: boolean;
  dias_teste?: number;
  desconto_pix: number;
  planos: Record<Plano, { dias: number; parcelas: number; cartao: number; pix: number }>;
};

// Mesmos valores do servidor (backend/config.py). A tela busca os atuais em /api/pagamento/precos.
const PRECOS_PADRAO: Precos = {
  desconto_pix: 10,
  planos: {
    mensal: { dias: 30, parcelas: 1, cartao: 4990, pix: 4490 },
    semestral: { dias: 183, parcelas: 6, cartao: 26940, pix: 24240 },
    anual: { dias: 365, parcelas: 12, cartao: 47880, pix: 43090 },
  },
};

const PLANOS: { chave: Plano; rotulo: string; detalhe: string }[] = [
  { chave: "mensal", rotulo: "Mensal", detalhe: "30 dias" },
  { chave: "semestral", rotulo: "Semestral", detalhe: "6 meses" },
  { chave: "anual", rotulo: "Anual", detalhe: "12 meses" },
];

const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function parcelado(centavos: number, parcelas: number) {
  return parcelas > 1 ? `ou ${parcelas}x de ${reais(Math.ceil(centavos / parcelas))}` : "à vista no cartão";
}

export function Signup() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState<Plano>("mensal");
  const [metodo, setMetodo] = useState<Metodo>("pix");
  const [precos, setPrecos] = useState<Precos>(PRECOS_PADRAO);
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });
  const [perguntaTeste, setPerguntaTeste] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/pagamento/precos`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.planos && setPrecos(d))
      .catch(() => {});
  }, []);

  // O botão "Começar" da tabela de planos abre /assinar?plano=<período>.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plano") as Plano | null;
    if (p && PLANOS.some((x) => x.chave === p)) setPlano(p);
  }, []);

  const atual = precos.planos[plano];
  const desconto = Math.round(precos.desconto_pix);

  const emTeste = precos.modo_teste && !precos.pagamento_disponivel;

  function guardarEmail() {
    try {
      localStorage.setItem("monvatti_email", email.trim().toLowerCase());
    } catch {}
  }

  // Ambiente de teste: sem cobrança, libera alguns dias de acesso e segue para a instalação.
  async function continuarSemPagar() {
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch(`${API}/api/pagamento/teste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), plano, metodo }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEstado({ tipo: "erro", msg: typeof dados.detail === "string" ? dados.detail : "Não consegui liberar o acesso de teste." });
        return;
      }
      guardarEmail();
      window.location.href = "/obrigado";
    } catch {
      setEstado({ tipo: "erro", msg: "Não consegui falar com o servidor. Tente de novo em instantes." });
    }
  }

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    if (emTeste) {
      setEstado({ tipo: "parado" });
      setPerguntaTeste(true);
      return;
    }
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch(`${API}/api/pagamento/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), plano, metodo }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok || !dados.url) {
        setEstado({ tipo: "erro", msg: typeof dados.detail === "string" ? dados.detail : "Não consegui gerar o pagamento. Tente de novo." });
        return;
      }
      guardarEmail();
      window.location.href = dados.url;
    } catch {
      setEstado({ tipo: "erro", msg: "Não consegui falar com o servidor. Tente de novo em instantes." });
    }
  }

  const campo =
    "foco rounded-xl border border-platina px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-aco/60 focus:border-azul";

  return (
    <form onSubmit={pagar} className="rounded-2xl border border-platina bg-card p-6 shadow-[0_18px_44px_-24px_rgba(7,10,26,0.3)]">
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink">Plano Mercado Livre</legend>
        <div className="grid grid-cols-3 gap-2">
          {PLANOS.map((p) => {
            const ativo = p.chave === plano;
            const valor = precos.planos[p.chave][metodo];
            return (
              <label
                key={p.chave}
                className={`cursor-pointer rounded-xl border px-2 py-2.5 text-center transition-colors ${
                  ativo ? "border-azul bg-nevoa" : "border-platina hover:border-azul/40"
                }`}
              >
                <input type="radio" name="plano" value={p.chave} checked={ativo} onChange={() => setPlano(p.chave)} className="sr-only" />
                <span className={`block text-[13px] font-semibold ${ativo ? "text-azul" : "text-ink"}`}>{p.rotulo}</span>
                <span className="tnum block text-[15px] font-semibold text-ink">{reais(valor)}</span>
                <span className="block text-[11px] text-aco">{p.detalhe}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 text-[13px] font-medium text-ink">Forma de pagamento</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["pix", "cartao"] as Metodo[]).map((m) => {
            const ativo = m === metodo;
            return (
              <label
                key={m}
                className={`relative cursor-pointer rounded-xl border px-3 py-2.5 transition-colors ${
                  ativo ? "border-azul bg-nevoa" : "border-platina hover:border-azul/40"
                }`}
              >
                <input type="radio" name="metodo" value={m} checked={ativo} onChange={() => setMetodo(m)} className="sr-only" />
                <span className={`flex items-center gap-2 text-[14px] font-semibold ${ativo ? "text-azul" : "text-ink"}`}>
                  {m === "pix" ? "Pix" : "Cartão de crédito"}
                  {m === "pix" && desconto > 0 ? (
                    <span className="rounded-full bg-[#1a8a2e]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1a8a2e]">−{desconto}%</span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-[12px] text-aco">
                  {m === "pix" ? `${reais(atual.pix)} · liberado na hora` : `${reais(atual.cartao)} ${parcelado(atual.cartao, atual.parcelas)}`}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium text-ink">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" className={campo} />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium text-ink">E-mail</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="voce@email.com" className={campo} />
        </label>
      </div>

      <button
        type="submit"
        disabled={estado.tipo === "enviando"}
        className="foco mt-4 w-full rounded-xl bg-marca py-3 text-sm font-semibold text-white transition-colors hover:bg-marca-forte disabled:opacity-60"
      >
        {estado.tipo === "enviando"
          ? "Gerando o pagamento…"
          : metodo === "pix"
            ? `Pagar ${reais(atual.pix)} com Pix`
            : `Pagar ${reais(atual.cartao)} no cartão`}
      </button>

      {perguntaTeste && estado.tipo !== "erro" ? (
        <div role="alertdialog" aria-labelledby="teste-titulo" className="mt-4 rounded-xl border border-[#b7791f]/30 bg-[#fdf6e7] p-4">
          <p id="teste-titulo" className="text-[14px] font-semibold text-ink">Pagamento indisponível no momento</p>
          <p className="mt-1 text-[13px] leading-relaxed text-aco">
            Este site está em teste. Se continuar, você não paga nada e recebe {precos.dias_teste || 7} dias de acesso para
            instalar e usar a extensão como um cliente usaria.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={continuarSemPagar}
              disabled={estado.tipo === "enviando"}
              className="foco rounded-lg bg-marca px-4 py-2 text-[13px] font-semibold text-white hover:bg-marca-forte disabled:opacity-60"
            >
              {estado.tipo === "enviando" ? "Liberando…" : "Continuar mesmo assim"}
            </button>
            <button
              type="button"
              onClick={() => setPerguntaTeste(false)}
              className="foco rounded-lg border border-platina bg-card px-4 py-2 text-[13px] font-semibold text-ink hover:border-azul/40"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {estado.tipo === "erro" ? (
        <p className="mt-3 text-[13px] text-[#d4343b]">{estado.msg}</p>
      ) : (
        <p className="mt-3 text-[12px] text-aco">
          Use o e-mail que você vai usar na extensão: é com ele que você entra. O acesso é liberado assim que o pagamento é
          aprovado. Já é cliente? Pagar de novo com o mesmo e-mail soma os dias ao seu acesso.
        </p>
      )}
    </form>
  );
}
