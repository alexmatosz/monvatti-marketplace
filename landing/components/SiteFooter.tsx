import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-platina/70 bg-white">
      <div className="mx-auto flex max-w-conteudo flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div>
          <Logo h={22} />
          <p className="mt-3 max-w-[52ch] text-[13px] text-aco">
            Monvatti Marketplaces — inteligência de anúncios para o Mercado Livre e, em breve, Shopee e Amazon. As vendas estimadas são aproximações a partir de números públicos, não dados oficiais dos marketplaces.
          </p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-aco">
            <Link className="foco hover:text-ink" href="/marketplaces">Marketplaces</Link>
            <Link className="foco hover:text-ink" href="/novidades">Novidades</Link>
            <Link className="foco hover:text-ink" href="/suporte">Suporte</Link>
            <Link className="foco hover:text-ink" href="/#faq">Dúvidas</Link>
          </nav>
        </div>
        <p className="text-[12px] text-aco">© {new Date().getFullYear()} Monvatti · uma ferramenta da consultoria Monvatti</p>
      </div>
    </footer>
  );
}
