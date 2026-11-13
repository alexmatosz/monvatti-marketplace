import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CANAIS } from "@/lib/canais";
import { MarcaMarketplace } from "@/components/Marcas";

export const metadata: Metadata = {
  title: "Marketplaces — o que a Monvatti Marketplaces faz em cada canal",
  description:
    "Mercado Livre, Shopee e Amazon: escolha um canal e veja o que a ferramenta entrega e o diferencial de cada um.",
};

export default function MarketplacesPagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Marketplaces</p>
        <h1 className="mt-2 max-w-[20ch] font-display text-[36px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[46px]">
          Uma ferramenta, cada canal do seu jeito.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-aco">
          O Monvatti Marketplaces lê cada marketplace com as regras dele — taxas, busca e logística próprias.
          Escolha um canal para ver o que já funciona e o que está a caminho.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CANAIS.map((c) => (
            <Link
              key={c.id}
              href={`/marketplaces/${c.id}`}
              className="foco group flex flex-col rounded-3xl border border-platina bg-card p-7 transition-all hover:-translate-y-0.5 hover:border-azul hover:shadow-[0_28px_60px_-30px_rgba(7,10,26,0.4)]"
            >
              <MarcaMarketplace nome={c.id} tamanho={52} />
              <div className="mt-5 flex items-center gap-2">
                <h2 className="font-display text-[20px] font-bold text-ink">{c.nome}</h2>
                {c.estado === "breve" ? (
                  <span className="rounded-full bg-platina/60 px-2 py-0.5 text-[10.5px] font-semibold text-aco">em breve</span>
                ) : (
                  <span className="rounded-full bg-azul/10 px-2 py-0.5 text-[10.5px] font-semibold text-azul">ativo</span>
                )}
              </div>
              <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-aco">{c.diferencial}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-azul">
                Ver o canal
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 10h10M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
