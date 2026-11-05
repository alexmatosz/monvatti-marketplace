import { Marca } from "./Logo";

export function SeloMarketplace({ nome, breve = false }: { nome: string; breve?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-platina bg-white px-2.5 py-1 text-[11.5px] font-medium text-aco">
      <span className={`h-1.5 w-1.5 rounded-full ${breve ? "bg-platina" : "bg-azul"}`} />
      {nome}
      {breve ? <span className="text-aco/60">· em breve</span> : null}
    </span>
  );
}

function Frame({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-platina/80 bg-white shadow-[0_28px_60px_-28px_rgba(7,10,26,0.4)]">
      <div className="flex items-center gap-2 border-b border-platina/70 bg-[#F7F8FB] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex items-center gap-1.5 text-[11px] text-aco">
          <Marca size={13} /> {etiqueta}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function ConcorrenciaMock() {
  const linhas = [
    ["Smartwatch D20 — líder", "2.480", "R$ 79", "Full"],
    ["Relógio inteligente Y68", "1.120", "R$ 64", "Flex"],
    ["Smartband fitness à prova", "870", "R$ 99", "Coleta"],
    ["Pulseira smart Colmi", "540", "R$ 118", "Correios"],
  ];
  return (
    <Frame etiqueta="busca · smartwatch">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-semibold text-ink">Concorrência — página 1</span>
        <span className="text-aco">38 anúncios</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[12px]">
        <div className="border-b border-platina/70 pb-1.5 text-aco">Anúncio</div>
        <div className="border-b border-platina/70 pb-1.5 text-right text-aco">Vendas/mês</div>
        <div className="border-b border-platina/70 pb-1.5 text-right text-aco">Preço</div>
        <div className="border-b border-platina/70 pb-1.5 text-right text-aco">Envio</div>
        {linhas.map((l, i) => (
          <div key={l[0]} className="contents">
            <div className={`truncate py-2 ${i === 0 ? "font-medium text-ink" : "text-ink/80"}`}>{l[0]}</div>
            <div className="tnum py-2 text-right font-semibold text-azul">{l[1]}</div>
            <div className="tnum py-2 text-right text-ink/80">{l[2]}</div>
            <div className="py-2 text-right text-aco">{l[3]}</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

export function CalculadoraMock() {
  const linhas: [string, string][] = [
    ["Preço de venda", "R$ 129,90"],
    ["Comissão (14%)", "− R$ 18,19"],
    ["Taxa fixa", "− R$ 6,00"],
    ["Frete grátis", "− R$ 21,90"],
    ["Imposto (7%)", "− R$ 9,09"],
    ["Custo do produto", "− R$ 48,00"],
  ];
  return (
    <Frame etiqueta="calculadora de margem">
      <div className="space-y-1.5">
        {linhas.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between py-1 text-[12.5px]">
            <span className="text-aco">{k}</span>
            <span className={`tnum ${i === 0 ? "font-semibold text-ink" : "text-ink/80"}`}>{v}</span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between rounded-xl bg-nevoa px-3 py-2.5">
          <span className="text-[12.5px] font-semibold text-ink">Lucro líquido</span>
          <span className="tnum text-[16px] font-semibold text-azul">R$ 26,72 · 20,6%</span>
        </div>
      </div>
    </Frame>
  );
}

export function TendenciaMock() {
  const itens = [
    ["Air Fryer 5L Digital", "4.900/mês"],
    ["Air Fryer Oven 12L", "3.120/mês"],
    ["Fritadeira sem óleo 3,5L", "2.260/mês"],
    ["Air Fryer Gourmet 8L", "1.740/mês"],
    ["Mini Air Fryer 2L", "980/mês"],
  ];
  return (
    <Frame etiqueta="tendência · air fryer">
      <div className="mb-2 text-[12px] font-semibold text-ink">Mais vendidos da categoria</div>
      <div className="space-y-0.5">
        {itens.map((it, i) => (
          <div key={it[0]} className="flex items-center gap-3 py-1.5">
            <span className="tnum w-5 text-center text-[12px] font-semibold text-azul">{i + 1}</span>
            <span className="h-7 w-7 flex-none rounded-md bg-gradient-to-br from-nevoa to-platina/50" />
            <span className="flex-1 truncate text-[12.5px] text-ink/85">{it[0]}</span>
            <span className="tnum text-[12px] font-semibold text-ink">{it[1]}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
