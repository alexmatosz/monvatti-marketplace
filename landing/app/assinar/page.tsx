import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Signup } from "@/components/Signup";

export const metadata: Metadata = {
  title: "Assinar — Monvatti Marketplaces",
  description: "Escolha o plano, pague por Pix com desconto ou cartão e instale a extensão Monvatti Marketplace.",
};

const PASSOS = [
  "Escolha o plano e a forma de pagamento.",
  "Pague por Pix (com desconto) ou cartão.",
  "Instale a extensão e entre com o e-mail da compra.",
];

export default function AssinarPagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto grid max-w-conteudo gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[42px]">
            Comece a estudar seus anúncios hoje.
          </h1>
          <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-aco">
            O e-mail da compra é o seu login: sem senha, só um código que chega na hora.
          </p>
          <ol className="mt-8 space-y-4">
            {PASSOS.map((p, i) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-ink">
                <span className="tnum flex h-7 w-7 flex-none items-center justify-center rounded-full bg-nevoa text-[13px] font-semibold text-azul">
                  {i + 1}
                </span>
                <span className="pt-0.5">{p}</span>
              </li>
            ))}
          </ol>
        </div>
        <Signup />
      </section>
      <SiteFooter />
    </>
  );
}
