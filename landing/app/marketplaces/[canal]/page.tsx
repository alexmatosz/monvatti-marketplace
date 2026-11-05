import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CANAIS, canalPorId } from "@/lib/canais";
import { ConcorrenciaMock, CalculadoraMock, TendenciaMock, BuyBoxMock } from "@/components/Mockups";

export function generateStaticParams() {
  return CANAIS.map((c) => ({ canal: c.id }));
}

export function generateMetadata({ params }: { params: { canal: string } }): Metadata {
  const canal = canalPorId(params.canal);
  if (!canal) return { title: "Marketplaces — Monvatti Marketplaces" };
  return {
    title: `${canal.nome} — Monvatti Marketplaces`,
    description: canal.diferencial,
  };
}

const MOCKS: Record<string, React.ReactNode[]> = {
  "mercado-livre": [<ConcorrenciaMock key="c" />, <CalculadoraMock key="m" />, <TendenciaMock key="t" />],
  shopee: [<CalculadoraMock key="m" />, <ConcorrenciaMock key="c" />],
  amazon: [<BuyBoxMock key="b" />],
};

const OUTROS = (atual: string) => CANAIS.filter((c) => c.id !== atual);

export default function CanalPagina({ params }: { params: { canal: string } }) {
  const canal = canalPorId(params.canal);
  if (!canal) notFound();

  const mocks = MOCKS[canal.id] ?? [];

  return (
    <>
      <SiteHeader voltar />

      {/* Hero do canal */}
      <section className="border-b border-platina/70 bg-nevoa/40">
        <div className="mx-auto max-w-conteudo px-6 py-14 sm:py-20">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-9 items-center gap-2 rounded-full border border-platina bg-white px-3 text-[13px] font-semibold text-ink">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: canal.estado === "breve" ? "#DFDCDB" : canal.cor }} />
              {canal.nome}
            </span>
            <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${canal.estado === "ativo" ? "bg-azul/10 text-azul" : "bg-platina/60 text-aco"}`}>
              {canal.estado === "ativo" ? "Disponível agora" : "Em breve"}
            </span>
          </div>
          <h1 className="mt-5 max-w-[22ch] font-display text-[36px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[48px]">
            {canal.tagline}
          </h1>
          <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-aco">{canal.resumo}</p>
        </div>
      </section>

      {/* Diferencial + prints */}
      <section className="mx-auto max-w-conteudo px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-azul">Diferencial no canal</p>
            <p className="mt-2 font-display text-[24px] font-bold leading-snug text-ink">{canal.diferencial}</p>
            <p className="mt-4 text-[15.5px] leading-relaxed text-aco">
              {canal.estado === "ativo"
                ? "Tudo isso dentro da página do marketplace, no momento em que você está decidindo."
                : "Estamos construindo este canal com o mesmo cuidado do Mercado Livre. Entre na lista para ser avisado no lançamento."}
            </p>
          </div>
          <div className="grid gap-5">
            {mocks.length > 0 ? mocks[0] : null}
            {mocks.length > 1 ? <div className="hidden sm:block">{mocks[1]}</div> : null}
          </div>
        </div>

        {/* Funcionalidades do canal */}
        <div className="mt-16">
          <h2 className="font-display text-[26px] font-bold tracking-tight text-ink">
            O que a ferramenta faz {canal.estado === "ativo" ? "no" : "vai fazer no"} {canal.nome}
          </h2>
          <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {canal.itens.map((it) => (
              <div key={it.t} className="flex gap-3 border-t border-platina pt-5">
                <svg width="18" height="18" viewBox="0 0 20 20" className="mt-0.5 flex-none" aria-hidden="true">
                  <path d="m5 10.5 3.2 3.2L15 7" stroke={canal.estado === "breve" ? "#5B6472" : "#001AD8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <div>
                  <h3 className="text-[15.5px] font-semibold text-ink">{it.t}</h3>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-aco">{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outros canais */}
        <div className="mt-16 border-t border-platina pt-8">
          <p className="text-[13px] font-medium text-aco">Outros canais</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {OUTROS(canal.id).map((c) => (
              <Link
                key={c.id}
                href={`/marketplaces/${c.id}`}
                className="foco inline-flex items-center gap-2 rounded-full border border-platina bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-azul"
              >
                <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: c.estado === "breve" ? "#DFDCDB" : c.cor }} />
                {c.nome}
                {c.estado === "breve" ? <span className="text-[11px] text-aco/60">em breve</span> : null}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/#cadastro" className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo">
            {canal.estado === "ativo" ? `Começar pelo ${canal.nome}` : "Entrar na lista de espera"}
          </Link>
          <Link href="/marketplaces" className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul">
            Ver todos os canais
          </Link>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
