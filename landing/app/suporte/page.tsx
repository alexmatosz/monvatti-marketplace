import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  title: "Suporte — Monvatti Marketplaces",
  description: "Tire dúvidas e fale com a equipe da Monvatti sobre a extensão e a sua conta.",
};

const TOPICOS = [
  { t: "Instalação", d: "Como adicionar a extensão ao Chrome e entrar com o seu e-mail." },
  { t: "Vincular a conta", d: "A autorização que libera o estudo e prende o acesso à sua conta." },
  { t: "Assinatura e acesso", d: "Planos, cobrança e como o e-mail do cadastro libera a ferramenta." },
  { t: "Leituras e estimativas", d: "De onde vêm as vendas estimadas e como usar sem errar a mão." },
];

const CONTATOS = [
  {
    rotulo: "Instagram",
    valor: "@monvatti.marketplaces",
    href: "https://instagram.com/monvatti.marketplaces",
    motivo: "instagram" as const,
  },
  {
    rotulo: "E-mail",
    valor: "suporte@monvattimarketplaces.com.br",
    href: "mailto:suporte@monvattimarketplaces.com.br?subject=Suporte%20Monvatti%20Marketplaces",
    motivo: "email" as const,
  },
  {
    rotulo: "WhatsApp",
    valor: "(11) 98888-0000",
    href: "https://wa.me/5511988880000",
    motivo: "whatsapp" as const,
  },
];

function IconeContato({ nome }: { nome: "instagram" | "email" | "whatsapp" }) {
  const comum = { fill: "none", stroke: "#001AD8", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (nome === "instagram")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...comum} />
        <circle cx="12" cy="12" r="4" {...comum} />
        <circle cx="17" cy="7" r="1.1" fill="#001AD8" stroke="none" />
      </svg>
    );
  if (nome === "whatsapp")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20l1.4-4A8 8 0 1 1 9 19.3L4 20Z" {...comum} />
        <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.8 0 1.2-.8.8-1.4l-1-1.2-1.5.6-1.8-1.8.6-1.5-1.2-1c-.6-.4-1.4 0-1.4.8Z" {...comum} />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" {...comum} />
      <path d="M4.5 7l7.5 6 7.5-6" {...comum} />
    </svg>
  );
}

export default function SuportePagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Suporte</p>
        <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[46px]">
          Precisa de ajuda? A gente resolve.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-aco">
          A mesma equipe da Monvatti que opera mais de 150 clientes atende você. Comece pelos temas abaixo ou fale direto com a gente.
        </p>

        {/* Contatos — um painel só */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-platina bg-white">
          <div className="grid divide-y divide-platina sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {CONTATOS.map((c) => (
              <a
                key={c.rotulo}
                href={c.href}
                target={c.motivo === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="foco group flex items-center gap-4 p-6 transition-colors hover:bg-nevoa"
              >
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-nevoa ring-1 ring-platina transition-colors group-hover:bg-white">
                  <IconeContato nome={c.motivo} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] font-medium text-aco">{c.rotulo}</span>
                  <span className="block truncate text-[14.5px] font-bold text-ink">{c.valor}</span>
                </span>
              </a>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[12px] text-aco/70">
          Atendimento de segunda a sexta, das 9h às 18h. Contatos de exemplo — a confirmar antes do lançamento.
        </p>

        {/* Temas — lista com régua */}
        <div className="mt-14">
          <h2 className="font-display text-[20px] font-bold tracking-tight text-ink">Comece por um tema</h2>
          <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {TOPICOS.map((t) => (
              <div key={t.t} className="border-t-2 border-platina pt-4">
                <h3 className="text-[15.5px] font-bold text-ink">{t.t}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-aco">{t.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-14 max-w-[760px]">
          <h2 className="font-display text-[24px] font-bold tracking-tight text-ink">Dúvidas frequentes</h2>
          <div className="mt-6">
            <Faq />
          </div>
          <div className="mt-8">
            <Link href="/#cadastro" className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo">
              Começar agora
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
