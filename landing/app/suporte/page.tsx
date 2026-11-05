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

export default function SuportePagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Suporte</p>
        <h1 className="mt-2 font-display text-[36px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[46px]">
          Precisa de ajuda? A gente resolve.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-aco">
          A mesma equipe da Monvatti que opera mais de 150 clientes atende você. Comece pelos temas abaixo ou fale direto com a gente.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {TOPICOS.map((t) => (
            <div key={t.t} className="rounded-2xl border border-platina bg-white p-5">
              <h2 className="text-[15.5px] font-semibold text-ink">{t.t}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-aco">{t.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-platina bg-nevoa/50 p-7 sm:p-9">
          <h2 className="font-display text-[22px] font-semibold text-ink">Fale com a equipe</h2>
          <p className="mt-2 max-w-[56ch] text-[15.5px] leading-relaxed text-aco">
            Não achou a resposta? Escreva para a gente com o e-mail do seu cadastro que respondemos por lá.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="mailto:alexmonvatti@gmail.com?subject=Suporte%20Monvatti%20Marketplaces"
              className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo"
            >
              Enviar e-mail
            </a>
            <Link
              href="/#faq"
              className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul"
            >
              Ver dúvidas frequentes
            </Link>
          </div>
        </div>

        <div className="mt-14 max-w-[760px]">
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">Dúvidas frequentes</h2>
          <div className="mt-6">
            <Faq />
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
