"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Estado =
  | { tipo: "parado" }
  | { tipo: "abrindo" }
  | { tipo: "colar"; state: string }
  | { tipo: "confirmando"; state: string }
  | { tipo: "ok"; apelido: string }
  | { tipo: "erro"; msg: string; state?: string };

async function postar(caminho: string, corpo: object) {
  const r = await fetch(`${API}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(typeof dados.detail === "string" ? dados.detail : "Não consegui falar com o servidor. Tente de novo.");
  return dados;
}

/**
 * Passo 2 do cadastro: o cliente autoriza o app do Mercado Livre com a PRÓPRIA
 * conta (só leitura). Quem autoriza é a tela oficial do ML; aqui só abrimos
 * essa tela e, no modo local, recebemos o código que o ML mostra.
 */
export function ConectarML({ convite, nome }: { convite: string; nome?: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    postar("/api/ml/convite/situacao", { convite })
      .then((d) => d.conectado && setEstado({ tipo: "ok", apelido: d.apelido || "" }))
      .catch(() => {});
  }, [convite]);

  // Enquanto o cliente autoriza na aba do ML, confere a cada 3 s se a conexão
  // terminou (a extensão captura o código sozinha) — sem copiar e colar.
  const aguardando = "state" in estado;
  useEffect(() => {
    if (!aguardando) return;
    const t = setInterval(() => {
      postar("/api/ml/convite/situacao", { convite })
        .then((d) => d.conectado && setEstado({ tipo: "ok", apelido: d.apelido || "" }))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [aguardando, convite]);

  async function conectar() {
    setEstado({ tipo: "abrindo" });
    try {
      const d = await postar("/api/ml/convite/conectar", { convite });
      if (d.manual) {
        window.open(d.url, "_blank", "noopener");
        setEstado({ tipo: "colar", state: d.state });
      } else {
        window.location.href = d.url;
      }
    } catch (e) {
      setEstado({ tipo: "erro", msg: (e as Error).message });
    }
  }

  async function confirmar(state: string) {
    if (!codigo.trim()) return setEstado({ tipo: "erro", msg: "Cole o código que o Mercado Livre mostrou.", state });
    setEstado({ tipo: "confirmando", state });
    try {
      const d = await postar("/api/ml/convite/colar", { convite, state, code: codigo.trim() });
      setEstado({ tipo: "ok", apelido: d.apelido || "" });
    } catch (e) {
      setEstado({ tipo: "erro", msg: (e as Error).message, state });
    }
  }

  if (estado.tipo === "ok") {
    return (
      <div className="rounded-2xl border border-[#0f8a5f]/25 bg-[#e3f6ee] p-6">
        <p className="font-display text-lg font-semibold text-ink">Mercado Livre conectado{estado.apelido ? ` (${estado.apelido})` : ""}.</p>
        <p className="mt-2 text-[15px] text-aco">
          Pronto. Instale a extensão, entre com o mesmo e-mail e abra qualquer anúncio do Mercado Livre: as informações aparecem na página.
        </p>
      </div>
    );
  }

  const state = "state" in estado ? estado.state : undefined;
  return (
    <div className="rounded-2xl border border-platina bg-white p-6 shadow-[0_18px_44px_-24px_rgba(7,10,26,0.3)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-azul">Passo 2 de 2</p>
      <p className="mt-1 font-display text-lg font-semibold text-ink">
        {nome ? `${nome}, conecte` : "Conecte"} a sua conta do Mercado Livre
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-aco">
        É o que libera taxas, frete e dados do vendedor na extensão. A autorização é feita na página oficial do Mercado Livre e é{" "}
        <b className="text-ink">só de leitura</b>: a Monvatti não altera anúncios, preços nem nada na sua conta. Você pode
        desconectar quando quiser.
      </p>

      {state ? (
        <div className="mt-4 grid gap-2">
          <p className="flex items-center gap-2 rounded-xl bg-nevoa px-3.5 py-3 text-[14px] text-ink">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-azul" aria-hidden="true" />
            Autorize na aba do Mercado Livre. Esta página atualiza sozinha quando terminar.
          </p>
          <label className="mt-2 grid gap-1.5">
            <span className="text-[13px] font-medium text-aco">Não atualizou? Cole aqui o código que o Mercado Livre mostrou</span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="TG-..."
              className="foco rounded-xl border border-platina px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-aco/60 focus:border-azul"
            />
          </label>
          <button
            onClick={() => confirmar(state)}
            disabled={estado.tipo === "confirmando"}
            className="foco rounded-xl bg-azul py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo disabled:opacity-60"
          >
            {estado.tipo === "confirmando" ? "Conectando…" : "Confirmar conexão"}
          </button>
        </div>
      ) : (
        <button
          onClick={conectar}
          disabled={estado.tipo === "abrindo"}
          className="foco mt-4 w-full rounded-xl bg-azul py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo disabled:opacity-60"
        >
          {estado.tipo === "abrindo" ? "Abrindo o Mercado Livre…" : "Conectar ao Mercado Livre"}
        </button>
      )}

      {estado.tipo === "erro" ? <p className="mt-3 text-[13px] text-[#d4343b]">{estado.msg}</p> : null}
      <p className="mt-3 text-[12px] text-aco">Prefere fazer depois? Dá para conectar pelo ícone da extensão.</p>
    </div>
  );
}
