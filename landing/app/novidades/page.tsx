import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Novidades — Monvatti Marketplaces",
  description: "O que mudou e o que está a caminho no Monvatti Marketplaces.",
};

type Item = { data: string; tag: "Novo" | "Em desenvolvimento" | "Planejado"; titulo: string; texto: string };

const ITENS: Item[] = [
  {
    data: "Novembro de 2026",
    tag: "Novo",
    titulo: "Cadastro aberto e extensão para o Mercado Livre",
    texto:
      "Painel dentro do anúncio e da busca: métricas, concorrência, calculadora de margem, ranqueamento e tendência por categoria. Cadastro pelo e-mail que depois libera o acesso.",
  },
  {
    data: "Novembro de 2026",
    tag: "Novo",
    titulo: "Ranqueamento e tendência por categoria",
    texto:
      "Veja em que posição um anúncio aparece para uma palavra-chave e o ranking de mais vendidos de cada categoria, direto no painel.",
  },
  {
    data: "Em breve",
    tag: "Em desenvolvimento",
    titulo: "Shopee",
    texto:
      "Concorrência da busca, vendas estimadas e calculadora de margem no padrão da Shopee — comissão, frete e cupons no cálculo do lucro.",
  },
  {
    data: "Em breve",
    tag: "Em desenvolvimento",
    titulo: "Amazon com Buy Box",
    texto:
      "Quem está com a caixa de compra e o preço exato para assumir o Buy Box sem derrubar a margem, além de taxas e concorrência da Amazon.",
  },
  {
    data: "Planejado",
    tag: "Planejado",
    titulo: "Pagamento por Pix via AbacatePay",
    texto:
      "Assinatura mensal, semestral ou anual, sem fidelidade. O acesso fica vinculado à conta que você conectar.",
  },
];

const COR: Record<Item["tag"], string> = {
  Novo: "bg-azul/10 text-azul",
  "Em desenvolvimento": "bg-[#FF9900]/15 text-[#9a5b00]",
  Planejado: "bg-platina/60 text-aco",
};

export default function NovidadesPagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Novidades</p>
        <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[46px]">
          O que mudou e o que vem por aí.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-aco">
          Acompanhe cada melhoria da ferramenta e o que está em desenvolvimento para os próximos canais.
        </p>

        <ol className="mt-12 max-w-[760px] space-y-8 border-l border-platina pl-6">
          {ITENS.map((it) => (
            <li key={it.titulo} className="relative">
              <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-azul ring-1 ring-platina" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[13px] font-medium text-aco">{it.data}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${COR[it.tag]}`}>{it.tag}</span>
              </div>
              <h2 className="mt-2 font-display text-[19px] font-semibold text-ink">{it.titulo}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-aco">{it.texto}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Link
            href="/#cadastro"
            className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo"
          >
            Começar agora
          </Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
