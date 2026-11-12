import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConectarML } from "@/components/ConectarML";

export const metadata: Metadata = {
  title: "Conectar o Mercado Livre — Monvatti Marketplaces",
  robots: { index: false },
};

export default function Conectar({ searchParams }: { searchParams: { convite?: string } }) {
  const convite = searchParams.convite || "";
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[560px] px-6 py-20">
        {convite ? (
          <ConectarML convite={convite} />
        ) : (
          <p className="text-[15px] text-aco">
            Este link de conexão está incompleto. Use o link que recebeu no cadastro ou conecte pelo ícone da extensão.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
