"use client";

import { useEffect, useRef, useState } from "react";
import { Print, type ChavePrint } from "@/components/Print";

const TELAS: { id: string; aba: string; titulo: string; texto: string; print: ChavePrint; maxH: number }[] = [
  {
    id: "anuncio",
    aba: "No anúncio",
    titulo: "Quanto o concorrente vende",
    texto: "Vendas estimadas, ritmo atual, vendas por dia e por mês, avaliações e faturamento, logo abaixo do preço do anúncio.",
    print: "painelVendas",
    maxH: 560,
  },
  {
    id: "custos",
    aba: "Taxas e datas",
    titulo: "O que sobra de cada venda",
    texto: "Quando o anúncio foi criado e quanto o vendedor recebe depois de comissão, taxa fixa, frete e imposto.",
    print: "painelCustos",
    maxH: 560,
  },
  {
    id: "busca",
    aba: "Na busca",
    titulo: "A concorrência inteira da página",
    texto: "Cada anúncio da busca ganha um quadro com vendas, faturamento, ritmo, logística, comissão e vendedor.",
    print: "cardsBusca",
    maxH: 560,
  },
  {
    id: "raiox",
    aba: "Raio-X",
    titulo: "O tamanho do nicho em segundos",
    texto: "Quanto a página inteira vende, a comissão da categoria e a curva ABC dos anúncios, com filtros por vendas e envio.",
    print: "raioX",
    maxH: 560,
  },
  {
    id: "margem",
    aba: "Calculadora",
    titulo: "A margem real antes de publicar",
    texto: "Digite o custo do produto e compare margem e ROI no Clássico e no Premium, lado a lado.",
    print: "calculadora",
    maxH: 560,
  },
  {
    id: "resumo",
    aba: "Resumo e Excel",
    titulo: "A busca somada e pronta para a planilha",
    texto: "Vendidos, vendas estimadas e faturamento da página somados. Um botão gera o estudo completo em Excel.",
    print: "resumoBusca",
    maxH: 560,
  },
];

export function Demonstracao() {
  const [atual, setAtual] = useState(0);
  const mexeu = useRef(false);

  // Passa sozinha pelas telas até a pessoa escolher uma.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!mexeu.current) setAtual((i) => (i + 1) % TELAS.length);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const tela = TELAS[atual];
  return (
    <div>
      <div role="tablist" aria-label="Telas da extensão" className="flex flex-wrap justify-center gap-2">
        {TELAS.map((t, i) => {
          const ativo = i === atual;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={ativo}
              aria-controls="demo-painel"
              onClick={() => {
                mexeu.current = true;
                setAtual(i);
              }}
              className={`foco rounded-full px-4 py-2 text-[14px] font-bold transition-colors ${
                ativo ? "bg-ink text-white" : "bg-card text-aco shadow-[0_0_0_1px_rgba(22,27,34,0.08)] hover:text-ink"
              }`}
            >
              {t.aba}
            </button>
          );
        })}
      </div>

      <div
        id="demo-painel"
        role="tabpanel"
        className="mt-8 grid items-center gap-10 rounded-[32px] bg-fundo p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:p-14"
      >
        <div key={`t-${tela.id}`} className="surge">
          <h3 className="font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">{tela.titulo}</h3>
          <p className="mt-3 max-w-[42ch] text-[16.5px] leading-relaxed text-aco">{tela.texto}</p>
          <div className="mt-6 flex gap-1.5" aria-hidden="true">
            {TELAS.map((t, i) => (
              <span key={t.id} className={`h-1.5 rounded-full transition-all ${i === atual ? "w-8 bg-marca" : "w-1.5 bg-platina"}`} />
            ))}
          </div>
        </div>
        <div key={`p-${tela.id}`} className="surge flex min-h-[300px] items-center justify-center lg:min-h-[560px]">
          <Print nome={tela.print} maxH={tela.maxH} className="w-full" />
        </div>
      </div>
    </div>
  );
}
