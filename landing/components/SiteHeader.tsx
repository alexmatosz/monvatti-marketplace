import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINKS = [
  { rotulo: "Sobre a Monvatti", href: "/#monvatti" },
  { rotulo: "Marketplaces", href: "/marketplaces" },
  { rotulo: "Novidades", href: "/novidades" },
  { rotulo: "Suporte", href: "/suporte" },
  { rotulo: "Dúvidas", href: "/#faq" },
];

export function SiteHeader({ voltar = false }: { voltar?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-platina/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-conteudo items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          {voltar ? (
            <Link
              href="/"
              className="foco inline-flex items-center gap-1.5 rounded-lg border border-platina px-2.5 py-1.5 text-[13px] font-medium text-aco transition-colors hover:border-azul hover:text-ink"
            >
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Voltar
            </Link>
          ) : null}
          <Link href="/" className="foco"><Logo h={24} /></Link>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-aco lg:flex">
          {LINKS.map((l) => (
            <Link key={l.href} className="foco whitespace-nowrap hover:text-ink" href={l.href}>
              {l.rotulo}
            </Link>
          ))}
        </nav>
        <Link
          href="/#cadastro"
          className="foco rounded-xl bg-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-vivo"
        >
          Começar
        </Link>
      </div>
    </header>
  );
}
