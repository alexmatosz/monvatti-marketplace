"use client";

import { useState } from "react";

type Canal = {
  id: string;
  nome: string;
  cor: string;
  estado: "ativo" | "breve";
  resumo: string;
  diferencial: string;
  itens: { t: string; d: string }[];
};

const CANAIS: Canal[] = [
  {
    id: "mercado-livre",
    nome: "Mercado Livre",
    cor: "#FFE600",
    estado: "ativo",
    resumo:
      "O canal mais completo hoje. O painel aparece dentro do anúncio e da busca, com tudo para decidir preço, produto e posição.",
    diferencial:
      "Vendas estimadas do concorrente a partir do número público do anúncio — a leitura que a API não entrega pronta.",
    itens: [
      { t: "Métricas do anúncio", d: "Visitas, vendas por dia e por mês, conversão e faturamento estimado." },
      { t: "Concorrência da busca", d: "Quem disputa a 1ª e as demais páginas, com vendas, preço e logística." },
      { t: "Calculadora de margem", d: "Comissão, taxa fixa, frete grátis e imposto descontados do seu preço." },
      { t: "Ranqueamento do anúncio", d: "Em que posição o anúncio aparece para uma palavra-chave." },
      { t: "Tendência por categoria", d: "O ranking oficial de mais vendidos para achar oportunidade de produto." },
      { t: "Logística e tipo", d: "Full, Flex, Coleta ou Correios, e se é Clássico ou Premium." },
      { t: "Exportação para Excel", d: "A busca inteira em uma planilha com um clique." },
      { t: "Conta protegida", d: "Roda pela sua conta vinculada; nunca alteramos preços dos seus anúncios." },
    ],
  },
  {
    id: "shopee",
    nome: "Shopee",
    cor: "#EE4D2D",
    estado: "breve",
    resumo:
      "Em desenvolvimento. A mesma leitura de concorrência e margem, adaptada às taxas e à busca da Shopee.",
    diferencial:
      "Margem no padrão da Shopee: comissão, taxa do programa de frete e cupons já no cálculo do lucro.",
    itens: [
      { t: "Vendas estimadas", d: "Leitura do volume do concorrente a partir dos números públicos da Shopee." },
      { t: "Concorrência da busca", d: "Quem aparece nas primeiras posições e por qual preço." },
      { t: "Calculadora de margem Shopee", d: "Comissão, frete e cupons descontados do preço de venda." },
      { t: "Tendência por categoria", d: "Os produtos em alta para achar oportunidade antes de anunciar." },
    ],
  },
  {
    id: "amazon",
    nome: "Amazon",
    cor: "#FF9900",
    estado: "breve",
    resumo:
      "Em desenvolvimento. Foco na disputa que define a venda na Amazon: o Buy Box.",
    diferencial:
      "Buy Box e price-to-win: quem está com a caixa de compra e o preço exato para assumir sem derrubar a sua margem.",
    itens: [
      { t: "Buy Box em tempo real", d: "Quem leva a caixa de compra no anúncio e por qual preço." },
      { t: "Preço para ganhar o Buy Box", d: "O valor exato para assumir a oferta principal do anúncio." },
      { t: "Taxas e margem da Amazon", d: "Comissão por categoria e tarifas descontadas do seu preço." },
      { t: "Concorrência da busca", d: "Os vendedores que disputam a mesma palavra-chave." },
    ],
  },
];

function Check({ cor }: { cor: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" className="mt-0.5 flex-none" aria-hidden="true">
      <path d="m5 10.5 3.2 3.2L15 7" stroke={cor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function MarketplacesTabs() {
  const [ativo, setAtivo] = useState(CANAIS[0].id);
  const canal = CANAIS.find((c) => c.id === ativo) ?? CANAIS[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CANAIS.map((c) => {
          const sel = c.id === ativo;
          return (
            <button
              key={c.id}
              onClick={() => setAtivo(c.id)}
              aria-pressed={sel}
              className={`foco inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                sel ? "border-azul bg-azul text-white" : "border-platina bg-white text-aco hover:border-azul hover:text-ink"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                style={{ background: c.estado === "breve" ? "#DFDCDB" : c.cor }}
                aria-hidden="true"
              />
              {c.nome}
              {c.estado === "breve" ? (
                <span className={`text-[10.5px] font-medium ${sel ? "text-white/70" : "text-aco/60"}`}>em breve</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl border border-platina bg-white p-7 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-9 items-center gap-2 rounded-full border border-platina px-3 text-[13px] font-semibold text-ink"
          >
            <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: canal.estado === "breve" ? "#DFDCDB" : canal.cor }} />
            {canal.nome}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              canal.estado === "ativo" ? "bg-azul/10 text-azul" : "bg-platina/60 text-aco"
            }`}
          >
            {canal.estado === "ativo" ? "Disponível agora" : "Em breve"}
          </span>
        </div>

        <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-aco">{canal.resumo}</p>

        <div className="mt-6 rounded-2xl border border-azul/20 bg-nevoa/60 p-5">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-azul">Diferencial no canal</p>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink">{canal.diferencial}</p>
        </div>

        <div className="mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {canal.itens.map((it) => (
            <div key={it.t} className="flex gap-3">
              <Check cor={canal.estado === "breve" ? "#5B6472" : "#001AD8"} />
              <div>
                <h3 className="text-[15px] font-semibold text-ink">{it.t}</h3>
                <p className="mt-0.5 text-[14px] leading-relaxed text-aco">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
