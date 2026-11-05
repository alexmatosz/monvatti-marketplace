"use client";

import { useState } from "react";

type Periodo = "mensal" | "semestral" | "anual";

const PLANOS: Record<Periodo, { mes: string; cobranca: string; selo?: string }> = {
  mensal: { mes: "49,90", cobranca: "Cobrança mensal" },
  semestral: { mes: "44,90", cobranca: "R$ 269,40 a cada 6 meses", selo: "−10%" },
  anual: { mes: "39,90", cobranca: "R$ 478,80 por ano", selo: "−20%" },
};

const INCLUI = [
  "Vendas estimadas e ritmo do concorrente",
  "Métricas do anúncio: visitas, conversão e faturamento",
  "Concorrência da 1ª e demais páginas",
  "Calculadora de margem (taxas, frete e imposto)",
  "Tendência por categoria e ranqueamento do anúncio",
  "Exportação para Excel",
];

const PERIODOS: { chave: Periodo; rotulo: string }[] = [
  { chave: "mensal", rotulo: "Mensal" },
  { chave: "semestral", rotulo: "Semestral" },
  { chave: "anual", rotulo: "Anual" },
];

export function Pricing() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const plano = PLANOS[periodo];

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-full border border-white/15 bg-white/[0.04] p-1">
          {PERIODOS.map((p) => {
            const ativo = p.chave === periodo;
            return (
              <button
                key={p.chave}
                onClick={() => setPeriodo(p.chave)}
                className={`foco rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  ativo ? "bg-white text-night" : "text-white/70 hover:text-white"
                }`}
              >
                {p.rotulo}
                {p.chave !== "mensal" && PLANOS[p.chave].selo ? (
                  <span className={`ml-1.5 text-[11px] ${ativo ? "text-azul" : "text-white/50"}`}>
                    {PLANOS[p.chave].selo}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-7 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white">Monvatti · Mercado Livre</span>
          {plano.selo ? (
            <span className="rounded-full bg-vivo/20 px-2 py-0.5 text-[11px] font-semibold text-[#aeb7ff]">
              {plano.selo} no período
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-end gap-1">
          <span className="tnum font-display text-5xl font-semibold text-white">
            R$ {plano.mes}
          </span>
          <span className="mb-1.5 text-sm text-white/60">/mês</span>
        </div>
        <p className="mt-1 text-sm text-white/55">{plano.cobranca}</p>

        <a
          href="#cadastro"
          className="foco mt-6 block rounded-xl bg-azul py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-vivo"
        >
          Começar
        </a>

        <ul className="mt-6 space-y-2.5">
          {INCLUI.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-white/75">
              <svg width="18" height="18" viewBox="0 0 20 20" className="mt-0.5 flex-none" aria-hidden="true">
                <path d="m5 10.5 3.2 3.2L15 7" stroke="#3145FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-center text-[12px] text-white/40">
        Valores de lançamento, a confirmar. Pagamento por Pix via AbacatePay, em breve.
      </p>
    </div>
  );
}
