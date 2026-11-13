import Image from "next/image";

// Prints reais da extensão rodando no Mercado Livre (public/prints).
// Os arquivos têm o dobro de pixels (2x) do tamanho exibido: w/h abaixo são o tamanho em tela,
// assim o texto fica nítido em telas retina e com escala do Windows acima de 100%.
export const PRINTS = {
  painelVendas: { src: "/prints/painel-vendas.webp", w: 421, h: 737, alt: "Painel da Monvatti num anúncio do Mercado Livre: vendas estimadas, ritmo atual, vendas por dia e por mês, avaliações e faturamento" },
  painelCustos: { src: "/prints/painel-custos.webp", w: 422, h: 556, alt: "Datas do anúncio e quanto o vendedor recebe, com comissão, taxa fixa, frete, imposto e custo máximo do produto" },
  calculadora: { src: "/prints/calculadora.webp", w: 556, h: 767, alt: "Calculadora de margem comparando Clássico e Premium, com custos, margem e ROI" },
  cardsBusca: { src: "/prints/busca-anuncios.webp", w: 584, h: 630, alt: "Busca do Mercado Livre com o quadro da Monvatti em cada anúncio: vendas, faturamento, ritmo, data de criação, logística, comissão e vendedor" },
  raioX: { src: "/prints/raio-x.webp", w: 320, h: 541, alt: "Raio-X da página de busca: vendidos na página, comissão da categoria e curva ABC dos anúncios" },
  resumoBusca: { src: "/prints/resumo-busca.webp", w: 1478, h: 250, alt: "Resumo da busca: vendidos, vendas estimadas, faturamento somado, patrocinados e estudo em planilha" },
} as const;

export type ChavePrint = keyof typeof PRINTS;

/* Sombra em camadas: contato curto + difusa longa. No fundo escuro, mais densa e com um halo da cor da marca. */
const SOMBRA = {
  claro:
    "shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_20px_-6px_rgba(16,24,40,0.10),0_28px_56px_-18px_rgba(16,24,40,0.22)]",
  escuro:
    "shadow-[0_2px_6px_rgba(0,0,0,0.22),0_24px_56px_-12px_rgba(0,0,0,0.55),0_0_90px_-14px_rgba(49,69,255,0.45)]",
} as const;

/* Tela da extensão, recortada rente ao painel, sem moldura. Nunca maior que o tamanho de tela definido. */
export function Print({
  nome,
  className = "",
  prioridade = false,
  maxW,
  maxH,
  tom = "claro",
}: {
  nome: ChavePrint;
  className?: string;
  prioridade?: boolean;
  maxW?: number;
  maxH?: number;
  tom?: keyof typeof SOMBRA;
}) {
  const p = PRINTS[nome];
  const largura = Math.min(maxW ?? Infinity, p.w, maxH ? (maxH * p.w) / p.h : Infinity);
  return (
    <figure
      className={`overflow-hidden rounded-[14px] ${SOMBRA[tom]} ${className}`}
      style={{ maxWidth: largura }}
    >
      <Image
        src={p.src}
        width={p.w}
        height={p.h}
        alt={p.alt}
        priority={prioridade}
        unoptimized
        className="block h-auto w-full"
      />
    </figure>
  );
}
