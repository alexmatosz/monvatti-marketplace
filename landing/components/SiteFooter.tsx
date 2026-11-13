import Link from "next/link";
import { Logo } from "@/components/Logo";
import { linkInstitucional } from "@/lib/monvatti";

export function SiteFooter() {
  const sobre = linkInstitucional();
  return (
    <footer className="bg-card">
      <div className="mx-auto max-w-conteudo px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <Logo h={22} />
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-aco">
            <Link className="foco hover:text-ink" href="/marketplaces">Marketplaces</Link>
            <Link className="foco hover:text-ink" href="/novidades">Novidades</Link>
            {sobre.externo ? (
              <a className="foco hover:text-ink" href={sobre.href} target="_blank" rel="noopener noreferrer">Sobre a Monvatti</a>
            ) : (
              <Link className="foco hover:text-ink" href={sobre.href}>Sobre a Monvatti</Link>
            )}
            <Link className="foco hover:text-ink" href="/suporte">Suporte</Link>
            <Link className="foco hover:text-ink" href="/privacidade">Privacidade</Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-platina pt-6 text-[12.5px] text-aco sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Monvatti. Uma ferramenta da consultoria Monvatti.</p>
          <p className="max-w-[60ch]">Vendas estimadas são aproximações a partir de números públicos, não dados oficiais dos marketplaces.</p>
        </div>
      </div>
    </footer>
  );
}
