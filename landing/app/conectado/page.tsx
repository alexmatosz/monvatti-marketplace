import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Mercado Livre conectado — Monvatti Marketplaces",
  robots: { index: false },
};

export default function Conectado({ searchParams }: { searchParams: { conta?: string } }) {
  const conta = (searchParams.conta || "").slice(0, 80);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[560px] px-6 py-20">
        <div className="rounded-2xl border border-[#0f8a5f]/25 bg-[#e3f6ee] p-8">
          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Mercado Livre conectado.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-aco">
            {conta ? (
              <>
                A conta <b className="text-ink">{conta}</b> foi autorizada.{" "}
              </>
            ) : null}
            Agora é só instalar a extensão, entrar com o e-mail do cadastro e abrir qualquer anúncio do Mercado Livre.
          </p>
          <Link href="/" className="foco mt-6 inline-block rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white hover:bg-vivo">
            Voltar ao site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
