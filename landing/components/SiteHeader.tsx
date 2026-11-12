import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketplacesMenu } from "@/components/MarketplacesMenu";

const LINKS = [
  { rotulo: "Funcionalidades", href: "/#funcionalidades" },
  { rotulo: "Como funciona", href: "/#demonstracao" },
  { rotulo: "Planos", href: "/#planos" },
  { rotulo: "Suporte", href: "/suporte" },
];

/*
  Menu em pílula flutuante. Na página inicial ele fica por cima do topo escuro
  (sobreposto); nas outras páginas reserva o espaço dele.
*/
export function SiteHeader({ voltar = false, sobreposto = false }: { voltar?: boolean; sobreposto?: boolean }) {
  return (
    <>
      <header className="fixed inset-x-0 top-4 z-[100] px-4">
        <div className="mx-auto flex h-[60px] max-w-[980px] items-center justify-between gap-4 rounded-full border border-black/[0.06] bg-white/95 pl-5 pr-2 shadow-[0_10px_30px_-12px_rgba(22,27,34,0.28)] backdrop-blur-md">
          <div className="flex items-center gap-3">
            {voltar ? (
              <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="foco -ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-aco transition-colors hover:bg-black/[0.05] hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ) : null}
            <Link href="/" className="foco"><Logo h={22} /></Link>
          </div>
          <nav aria-label="Principal" className="hidden items-center gap-6 text-[14.5px] font-medium text-aco lg:flex">
            <MarketplacesMenu />
            {LINKS.map((l) => (
              <Link key={l.href} className="foco whitespace-nowrap transition-colors hover:text-ink" href={l.href}>
                {l.rotulo}
              </Link>
            ))}
          </nav>
          <Link
            href="/#planos"
            className="foco rounded-full bg-marca px-5 py-2.5 text-[14.5px] font-bold text-white transition-colors hover:bg-marca-forte"
          >
            Assinar
          </Link>
        </div>
      </header>
      {sobreposto ? null : <div className="h-24" aria-hidden="true" />}
    </>
  );
}
