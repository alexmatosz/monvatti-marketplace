import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlogCover } from "@/components/BlogCover";
import { POSTS } from "@/lib/novidades";

export const metadata: Metadata = {
  title: "Novidades — Monvatti Marketplaces",
  description: "O que mudou e o que está a caminho no Monvatti Marketplaces.",
};

export default function NovidadesPagina() {
  const [destaque, ...resto] = POSTS;

  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Novidades</p>
        <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[46px]">
          O que mudou e o que vem por aí.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-aco">
          O diário da ferramenta: cada melhoria lançada e o que está em desenvolvimento para os próximos canais.
        </p>

        {/* Destaque */}
        <Link
          href={`/novidades/${destaque.slug}`}
          className="foco group mt-10 grid overflow-hidden rounded-3xl border border-platina bg-white transition-all hover:border-azul hover:shadow-[0_30px_70px_-34px_rgba(7,10,26,0.45)] lg:grid-cols-2"
        >
          <BlogCover post={destaque} alto />
          <div className="flex flex-col justify-center p-7 sm:p-9">
            <span className="text-[13px] text-aco">{destaque.data}</span>
            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">{destaque.titulo}</h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-aco">{destaque.resumo}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-azul">
              Ler novidade
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <path d="M5 10h10M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </Link>

        {/* Demais */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resto.map((p) => (
            <Link
              key={p.slug}
              href={`/novidades/${p.slug}`}
              className="foco group flex flex-col overflow-hidden rounded-3xl border border-platina bg-white transition-all hover:-translate-y-0.5 hover:border-azul hover:shadow-[0_28px_60px_-32px_rgba(7,10,26,0.4)]"
            >
              <BlogCover post={p} />
              <div className="flex flex-1 flex-col p-6">
                <span className="text-[12.5px] text-aco">{p.data}</span>
                <h3 className="mt-1.5 font-display text-[18px] font-semibold leading-snug text-ink">{p.titulo}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-aco">{p.resumo}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-azul">
                  Ler
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                    <path d="M5 10h10M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
