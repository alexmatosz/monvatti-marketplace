"use client";

import { useState } from "react";
import { ConectarML } from "@/components/ConectarML";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Estado = { tipo: "parado" | "enviando" | "ok" | "erro"; msg?: string; convite?: string };

export function Signup() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "parado" });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;
    setEstado({ tipo: "enviando" });
    try {
      const r = await fetch(`${API}/api/cadastro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim() }),
      });
      const dados = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEstado({ tipo: "erro", msg: typeof dados.detail === "string" ? dados.detail : "Não consegui concluir o cadastro. Tente de novo." });
        return;
      }
      setEstado({ tipo: "ok", convite: typeof dados.convite === "string" ? dados.convite : undefined,
        msg: "Cadastro recebido. Assim que o pagamento abrir, a gente libera o seu acesso por e-mail." });
    } catch {
      setEstado({ tipo: "erro", msg: "Não consegui falar com o servidor. Tente de novo em instantes." });
    }
  }

  if (estado.tipo === "ok" && estado.convite) {
    return <ConectarML convite={estado.convite} nome={nome.trim().split(" ")[0]} />;
  }

  if (estado.tipo === "ok") {
    return (
      <div className="rounded-2xl border border-azul/20 bg-nevoa p-6 text-center">
        <p className="font-display text-lg font-semibold text-ink">Tudo certo, {nome.split(" ")[0]}!</p>
        <p className="mx-auto mt-2 max-w-[48ch] text-[15px] text-aco">{estado.msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-platina bg-white p-6 shadow-[0_18px_44px_-24px_rgba(7,10,26,0.3)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium text-ink">Nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Seu nome"
            className="foco rounded-xl border border-platina px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-aco/60 focus:border-azul"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-[13px] font-medium text-ink">E-mail</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="voce@email.com"
            className="foco rounded-xl border border-platina px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-aco/60 focus:border-azul"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={estado.tipo === "enviando"}
        className="foco mt-4 w-full rounded-xl bg-azul py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo disabled:opacity-60"
      >
        {estado.tipo === "enviando" ? "Enviando…" : "Quero começar"}
      </button>

      {estado.tipo === "erro" ? (
        <p className="mt-3 text-[13px] text-[#d4343b]">{estado.msg}</p>
      ) : (
        <p className="mt-3 text-[12px] text-aco">
          É o mesmo e-mail que você vai usar na extensão. O pagamento por Pix entra em breve.
        </p>
      )}
    </form>
  );
}
