"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Print, PRINTS, type ChavePrint } from "@/components/Print";

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

const TOTAL = TELAS.length;
// No celular a tela não passa desta altura, para o slide caber sem rolar demais.
const ALTURA_MOVEL = 400;
const INTERVALO = 7000;
const dois = (n: number) => String(n).padStart(2, "0");

function Seta({ lado }: { lado: "esq" | "dir" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={lado === "esq" ? "M12 4.5 6.5 10l5.5 5.5" : "M8 4.5 13.5 10 8 15.5"}
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Carrossel das telas reais: desliza entre slides, com setas, indicadores, swipe e teclado.
   Passa sozinho até a pessoa interagir; pausa com o mouse em cima e respeita "reduzir movimento". */
export function Demonstracao() {
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [vistos, setVistos] = useState<Set<number>>(() => new Set([0, 1, TOTAL - 1]));
  const mexeu = useRef(false);
  const toque = useRef<{ x: number; y: number } | null>(null);

  const ir = useCallback((i: number, manual = true) => {
    if (manual) mexeu.current = true;
    const n = (i + TOTAL) % TOTAL;
    setAtual(n);
    // carrega a tela atual e as vizinhas, para a transição nunca mostrar um quadro vazio
    setVistos((v) => new Set([...v, n, (n + 1) % TOTAL, (n - 1 + TOTAL) % TOTAL]));
  }, []);

  useEffect(() => {
    if (pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!mexeu.current) setAtual((i) => {
        const n = (i + 1) % TOTAL;
        setVistos((v) => new Set([...v, n, (n + 1) % TOTAL]));
        return n;
      });
    }, INTERVALO);
    return () => clearInterval(t);
  }, [pausado]);

  return (
    <div
      role="region"
      aria-roledescription="carrossel"
      aria-label="Telas da extensão"
      className="relative overflow-hidden rounded-[32px] bg-fundo"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") ir(atual - 1);
        if (e.key === "ArrowRight") ir(atual + 1);
      }}
    >
      {/* trilho */}
      <div
        className="flex touch-pan-y transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: `translateX(-${atual * 100}%)` }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") toque.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const t = toque.current;
          toque.current = null;
          if (!t) return;
          const dx = e.clientX - t.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - t.y)) ir(atual + (dx < 0 ? 1 : -1));
        }}
      >
        {TELAS.map((tela, i) => {
          const ativo = i === atual;
          return (
            <div
              key={tela.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${TOTAL}: ${tela.aba}`}
              aria-hidden={!ativo}
              {...(!ativo ? ({ inert: "" } as Record<string, string>) : {})}
              className="grid w-full flex-none items-center gap-8 p-6 pb-24 sm:p-10 sm:pb-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 lg:p-14 lg:pb-28"
            >
              <div className={`transition-all delay-150 duration-700 ${ativo ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"} motion-reduce:transition-none`}>
                <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-marca">
                  {dois(i + 1)} <span className="text-platina">/</span> {tela.aba}
                </p>
                <h3 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">{tela.titulo}</h3>
                <p className="mt-3 max-w-[42ch] text-[16.5px] leading-relaxed text-aco">{tela.texto}</p>
              </div>
              <div className="flex min-h-[220px] items-center justify-center lg:min-h-[560px]">
                <div
                  className="w-full max-w-[var(--larg-movel)] lg:max-w-full"
                  style={{ ["--larg-movel" as string]: `${Math.round((ALTURA_MOVEL * PRINTS[tela.print].w) / PRINTS[tela.print].h)}px` }}
                >
                  {vistos.has(i) ? <Print nome={tela.print} maxH={tela.maxH} prioridade={i === 0} className="mx-auto w-full" /> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* controles */}
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between gap-4 sm:inset-x-10 sm:bottom-8 lg:inset-x-14">
        <div className="flex items-center gap-1" role="group" aria-label="Escolher tela">
          {TELAS.map((t, i) => {
            const ativo = i === atual;
            return (
              <button
                key={t.id}
                onClick={() => ir(i)}
                aria-label={`Ver ${t.aba}`}
                aria-current={ativo ? "true" : undefined}
                className="foco group flex h-8 items-center px-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ${
                    ativo ? "w-8 bg-marca" : "w-1.5 bg-platina group-hover:bg-aco/50"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <span className="mr-2 hidden text-[13px] font-semibold tabular-nums text-aco sm:inline" aria-live="polite">
            {dois(atual + 1)} / {dois(TOTAL)}
          </span>
          <button
            onClick={() => ir(atual - 1)}
            aria-label="Tela anterior"
            className="foco flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-[0_0_0_1px_rgba(22,27,34,0.08),0_6px_16px_-8px_rgba(22,27,34,0.25)] transition-colors hover:bg-ink hover:text-white"
          >
            <Seta lado="esq" />
          </button>
          <button
            onClick={() => ir(atual + 1)}
            aria-label="Próxima tela"
            className="foco flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-[0_0_0_1px_rgba(22,27,34,0.08),0_6px_16px_-8px_rgba(22,27,34,0.25)] transition-colors hover:bg-ink hover:text-white"
          >
            <Seta lado="dir" />
          </button>
        </div>
      </div>
    </div>
  );
}
