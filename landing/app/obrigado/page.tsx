import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StatusPagamento } from "@/components/StatusPagamento";

export const metadata: Metadata = {
  title: "Pagamento recebido — Monvatti Marketplaces",
  description: "Instale a extensão Monvatti Marketplace e entre com o e-mail da compra.",
  robots: { index: false },
};

const PASSOS = [
  { t: "Instale a extensão", d: "Clique em “Instalar no Chrome” e depois em “Usar no Chrome”. Leva 10 segundos." },
  { t: "Entre com o seu e-mail", d: "Clique no ícone da Monvatti na barra do Chrome e digite o e-mail da compra." },
  { t: "Cole o código", d: "Chega um código de 6 números no seu e-mail. Cole na extensão e pronto." },
];

export default function ObrigadoPagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <h1 className="font-display text-[36px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[46px]">
          Obrigado! Agora é só instalar.
        </h1>
        <div className="mt-8 max-w-[640px]">
          <StatusPagamento />
        </div>
        <ol className="mt-12 grid max-w-[900px] gap-x-10 gap-y-7 sm:grid-cols-3">
          {PASSOS.map((p, n) => (
            <li key={p.t} className="border-t-2 border-platina pt-4">
              <span className="font-display text-[13px] font-bold text-azul">Passo {n + 1}</span>
              <h2 className="mt-1 text-[15.5px] font-bold text-ink">{p.t}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-aco">{p.d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 max-w-[64ch] text-[13px] text-aco">
          Também mandamos esses passos para o seu e-mail. Não chegou? Confira o spam e as promoções, ou fale com a gente na
          página de <a className="font-semibold text-azul" href="/suporte">suporte</a>.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
