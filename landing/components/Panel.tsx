import { Marca } from "./Logo";

function Spark() {
  // Área de "visitas e projeção" — ilustrativa.
  const pts = [6, 9, 8, 14, 22, 36, 52, 60, 58];
  const w = 260;
  const h = 64;
  const max = Math.max(...pts);
  const step = w / (pts.length - 1);
  const linha = pts.map((p, i) => `${i * step},${h - (p / max) * (h - 8) - 4}`).join(" ");
  const area = `0,${h} ${linha} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="mv-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3145FF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#3145FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#mv-area)" />
      <polyline points={linha} fill="none" stroke="#001AD8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Kpi({ rotulo, valor, sub }: { rotulo: string; valor: string; sub?: string }) {
  return (
    <div className="px-3.5 py-3">
      <div className="text-[11px] text-aco">{rotulo}</div>
      <div className="tnum mt-0.5 text-[15px] font-semibold text-ink">{valor}</div>
      {sub ? <div className="text-[10.5px] text-aco/80">{sub}</div> : null}
    </div>
  );
}

export function Panel() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[28px] bg-gradient-to-br from-nevoa to-white blur-0" />
      <div className="overflow-hidden rounded-2xl border border-platina/80 bg-white shadow-[0_28px_60px_-28px_rgba(7,10,26,0.45)]">
        {/* Barra do "anúncio" do Mercado Livre */}
        <div className="flex items-center gap-2 border-b border-platina/70 bg-[#F7F8FB] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-[11px] text-aco">mercadolivre.com.br · anúncio</span>
        </div>

        <div className="p-4">
          <p className="mb-3 line-clamp-1 text-[13px] font-medium text-ink">
            Kit 2 Acendedor de Fogão Elétrico, Plasma Recarregável USB
          </p>

          {/* Cabeçalho do painel Monvatti */}
          <div className="flex items-center gap-2 rounded-t-xl border border-platina/70 bg-ink/[0.02] px-3 py-2">
            <Marca size={18} />
            <span className="text-[12px] font-semibold text-ink">Painel Monvatti</span>
            <span className="ml-auto rounded-full bg-nevoa px-2 py-0.5 text-[10.5px] font-semibold text-azul">
              Coleta + Flex
            </span>
          </div>

          {/* Destaques */}
          <div className="grid grid-cols-2 overflow-hidden border-x border-platina/70 bg-gradient-to-b from-[#F5F7FF] to-nevoa">
            <div className="px-3.5 py-3">
              <div className="text-[11px] text-aco">Vendas estimadas/mês</div>
              <div className="tnum mt-1 text-[26px] font-semibold leading-none text-azul">1.552</div>
              <div className="text-[11px] text-aco/80">a partir de “+1 mil vendidos”</div>
            </div>
            <div className="border-l border-platina/70 px-3.5 py-3">
              <div className="text-[11px] text-aco">Faturamento/mês</div>
              <div className="tnum mt-1 text-[26px] font-semibold leading-none text-ink">R$ 599,9 mil</div>
              <div className="text-[11px] text-aco/80">preço × projeção</div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 border border-platina/70">
            <div className="border-b border-r border-platina/70">
              <Kpi rotulo="Visitas" valor="318.914" />
            </div>
            <div className="border-b border-platina/70">
              <Kpi rotulo="Vendas/dia" valor="13" />
            </div>
            <div className="border-r border-platina/70">
              <Kpi rotulo="Conversão" valor="3,14%" />
            </div>
            <div>
              <Kpi rotulo="Tipo" valor="Clássico" sub="no ar há 214 dias" />
            </div>
          </div>

          {/* Gráfico */}
          <div className="rounded-b-xl border border-t-0 border-platina/70 px-3.5 pb-3 pt-2.5">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[11px] text-aco">Visitas e projeção de vendas</span>
              <span className="tnum text-[11px] font-semibold text-azul">+38% no mês</span>
            </div>
            <Spark />
          </div>
        </div>
      </div>
    </div>
  );
}
