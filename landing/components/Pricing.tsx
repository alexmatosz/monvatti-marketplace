"use client";

import { useState } from "react";

type Periodo = "mensal" | "semestral" | "anual";

const PERIODOS: { chave: Periodo; rotulo: string; selo?: string }[] = [
  { chave: "mensal", rotulo: "Mensal" },
  { chave: "semestral", rotulo: "Semestral", selo: "−10%" },
  { chave: "anual", rotulo: "Anual", selo: "−20%" },
];

type Plano = {
  nome: string;
  marketplace: string;
  breve?: boolean;
  destaque?: boolean;
  precos: Record<Periodo, { mes: string; cobranca: string }>;
  inclui: string[];
  cta: string;
};

const PLANOS: Plano[] = [
  {
    nome: "Mercado Livre",
    marketplace: "Para quem vende no Mercado Livre",
    precos: {
      mensal: { mes: "49,90", cobranca: "Cobrança mensal" },
      semestral: { mes: "44,90", cobranca: "R$ 269,40 a cada 6 meses" },
      anual: { mes: "39,90", cobranca: "R$ 478,80 por ano" },
    },
    inclui: [
      "Vendas estimadas e ritmo do concorrente",
      "Métricas: visitas, conversão e faturamento",
      "Concorrência da 1ª e demais páginas",
      "Calculadora de margem",
      "Tendência por categoria e ranqueamento",
      "Exportação para Excel",
    ],
    cta: "Começar",
  },
  {
    nome: "Combo",
    marketplace: "Mercado Livre + Shopee numa assinatura",
    destaque: true,
    precos: {
      mensal: { mes: "79,90", cobranca: "Cobrança mensal · economize R$ 19,90" },
      semestral: { mes: "71,90", cobranca: "R$ 431,40 a cada 6 meses" },
      anual: { mes: "63,90", cobranca: "R$ 766,80 por ano" },
    },
    inclui: [
      "Tudo do plano Mercado Livre",
      "Tudo do plano Shopee quando lançar",
      "Um acesso para os dois marketplaces",
      "Prioridade nos recursos novos",
    ],
    cta: "Começar",
  },
  {
    nome: "Shopee",
    marketplace: "Para quem vende na Shopee",
    breve: true,
    precos: {
      mensal: { mes: "49,90", cobranca: "Cobrança mensal" },
      semestral: { mes: "44,90", cobranca: "R$ 269,40 a cada 6 meses" },
      anual: { mes: "39,90", cobranca: "R$ 478,80 por ano" },
    },
    inclui: [
      "Vendas estimadas do concorrente",
      "Métricas e concorrência da busca",
      "Calculadora de margem da Shopee",
      "Tendência por categoria",
    ],
    cta: "Avise-me",
  },
];

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" className="mt-0.5 flex-none" aria-hidden="true">
      <path d="m5 10.5 3.2 3.2L15 7" stroke="#3145FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Pricing() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");

  return (
    <div>
      <div className="mb-10 flex justify-center">
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
                {p.selo ? <span className={`ml-1.5 text-[11px] ${ativo ? "text-azul" : "text-white/45"}`}>{p.selo}</span> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANOS.map((plano) => {
          const preco = plano.precos[periodo];
          return (
            <div
              key={plano.nome}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                plano.destaque
                  ? "border-vivo/60 bg-white/[0.06] shadow-[0_0_0_1px_rgba(49,69,255,0.4)]"
                  : "border-white/12 bg-white/[0.03]"
              } ${plano.breve ? "opacity-85" : ""}`}
            >
              {plano.destaque ? (
                <span className="absolute -top-3 left-7 rounded-full bg-vivo px-3 py-1 text-[11px] font-semibold text-white">
                  Mais completo
                </span>
              ) : null}

              <div className="flex items-center gap-2">
                <h3 className="font-display text-[18px] font-semibold text-white">{plano.nome}</h3>
                {plano.breve ? (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white/70">em breve</span>
                ) : null}
              </div>
              <p className="mt-1 text-[13px] text-white/55">{plano.marketplace}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="tnum font-display text-[40px] font-semibold leading-none text-white">R$ {preco.mes}</span>
                <span className="mb-1 text-sm text-white/55">/mês</span>
              </div>
              <p className="mt-1.5 text-[12.5px] text-white/50">{preco.cobranca}</p>

              <a
                href="#cadastro"
                className={`foco mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                  plano.destaque
                    ? "bg-azul text-white hover:bg-vivo"
                    : "border border-white/15 text-white hover:bg-white/10"
                }`}
              >
                {plano.cta}
              </a>

              <ul className="mt-6 space-y-2.5">
                {plano.inclui.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13.5px] text-white/75">
                    <Check />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[12px] text-white/40">
        Valores de lançamento, fictícios por enquanto — a confirmar. Pagamento por Pix via AbacatePay, em breve. Sem fidelidade.
      </p>
    </div>
  );
}
