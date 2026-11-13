import { Marca } from "./Logo";
import { MarcaMarketplace } from "./Marcas";

export function SeloMarketplace({ nome, breve = false }: { nome: string; breve?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-platina bg-card py-1 pl-1 pr-2.5 text-[11.5px] font-medium text-aco">
      <MarcaMarketplace nome={nome} tamanho={16} />
      {nome}
      {breve ? <span className="text-aco/60">· em breve</span> : null}
    </span>
  );
}

function Frame({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-platina/80 bg-card shadow-[0_28px_60px_-28px_rgba(7,10,26,0.4)]">
      <div className="flex items-center gap-2 border-b border-platina/70 bg-card2 px-4 py-2.5">
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

export function BuyBoxMock() {
  const linhas = [
    ["Você", "R$ 134,90", "Perdendo", false],
    ["Vendedor A — Buy Box", "R$ 129,90", "Ganhando", true],
    ["Vendedor B", "R$ 131,50", "Perdendo", false],
  ] as const;
  return (
    <Frame etiqueta="Amazon · Buy Box">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-semibold text-ink">Quem leva a caixa de compra</span>
        <span className="text-aco">3 ofertas</span>
      </div>
      <div className="space-y-1.5">
        {linhas.map(([quem, preco, estado, ganha]) => (
          <div
            key={quem}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-[12.5px] ${
              ganha ? "bg-nevoa" : "bg-card2"
            }`}
          >
            <span className={ganha ? "font-semibold text-ink" : "text-ink/80"}>{quem}</span>
            <span className="flex items-center gap-2.5">
              <span className="tnum text-ink/80">{preco}</span>
              <span className={`text-[11px] font-semibold ${ganha ? "text-azul" : "text-aco/70"}`}>{estado}</span>
            </span>
          </div>
        ))}
        <div className="mt-2 flex items-center justify-between rounded-xl bg-azul/5 px-3 py-2.5">
          <span className="text-[12.5px] font-semibold text-ink">Preço para ganhar o Buy Box</span>
          <span className="tnum text-[16px] font-semibold text-azul">R$ 129,89</span>
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

/* Prints compactos dos três passos. */
function MiniFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-platina bg-card shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)] ${className}`}>
      {children}
    </div>
  );
}

export function PassoInstalar() {
  return (
    <MiniFrame>
      <div className="flex items-center gap-2 bg-card2 px-3 py-2">
        <span className="flex-1 truncate rounded-md bg-card px-2.5 py-1 text-[10.5px] text-aco ring-1 ring-platina">
          mercadolivre.com.br
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-azul/10 ring-1 ring-azul/30">
          <Marca size={12} />
        </span>
      </div>
      <div className="flex items-center gap-2.5 px-3 py-3">
        <Marca size={18} />
        <div className="flex-1">
          <p className="text-[11.5px] font-semibold text-ink">Monvatti Marketplaces</p>
          <p className="text-[10px] text-aco">adicionada ao Chrome</p>
        </div>
        <span className="rounded-md bg-[#28c840]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">ativa</span>
      </div>
    </MiniFrame>
  );
}

export function PassoCodigo() {
  return (
    <MiniFrame>
      <div className="flex items-center gap-2 border-b border-platina px-3 py-2">
        <Marca size={14} />
        <span className="text-[11px] font-semibold text-ink">Entrar</span>
      </div>
      <div className="px-3 py-3">
        <p className="text-[10px] text-aco">Enviamos um código para voce@email.com</p>
        <div className="mt-2 grid grid-cols-6 gap-1.5">
          {["4", "8", "2", "1", "9", "6"].map((n, i) => (
            <span key={i} className="tnum rounded-md bg-card2 py-1.5 text-center text-[13px] font-semibold text-ink ring-1 ring-platina">
              {n}
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-[9.5px] text-azul">Reenviar código</p>
      </div>
    </MiniFrame>
  );
}

export function PassoPainel() {
  return (
    <MiniFrame>
      <div className="flex gap-1 border-b border-platina px-3 pt-2.5 text-[10px]">
        {["Vendas", "Margem", "Busca", "Datas"].map((aba, i) => (
          <span
            key={aba}
            className={`rounded-t-md px-2 py-1 ${i === 0 ? "bg-card font-semibold text-azul ring-1 ring-platina" : "text-aco"}`}
          >
            {aba}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 py-3">
        {[
          ["Estimadas", "15.525"],
          ["Ritmo", "656/mês"],
          ["Margem", "39,16%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-card2 px-2 py-1.5">
            <p className="text-[9px] text-aco">{k}</p>
            <p className="tnum text-[12px] font-semibold text-ink">{v}</p>
          </div>
        ))}
      </div>
    </MiniFrame>
  );
}
