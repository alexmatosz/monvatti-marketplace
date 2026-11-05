import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketplacesTabs } from "@/components/MarketplacesTabs";

export const metadata: Metadata = {
  title: "Marketplaces — o que a Monvatti Marketplaces faz em cada canal",
  description:
    "Mercado Livre, Shopee e Amazon: veja o que a ferramenta entrega em cada canal de venda e o diferencial de cada um.",
};

export default function MarketplacesPagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Marketplaces</p>
        <h1 className="mt-2 max-w-[20ch] font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[46px]">
          Uma ferramenta, cada canal do seu jeito.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-aco">
          O Monvatti Marketplaces lê cada marketplace com as regras dele — taxas, busca e logística próprias.
          Veja o que já funciona e o que está a caminho em cada canal de venda.
        </p>

        <div className="mt-10">
          <MarketplacesTabs />
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            href="/#cadastro"
            className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo"
          >
            Começar pelo Mercado Livre
          </Link>
          <Link
            href="/"
            className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul"
          >
            Voltar para o início
          </Link>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
