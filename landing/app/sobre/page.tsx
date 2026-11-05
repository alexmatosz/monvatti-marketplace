import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Marca } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sobre a Monvatti — a consultoria por trás da ferramenta",
  description:
    "A Monvatti é a consultoria que opera mais de 150 clientes em marketplaces. O Monvatti Marketplaces é a ferramenta que nasce desse trabalho.",
};

const PILARES = [
  { t: "Pesquisa de mercado", d: "Que produto vender, com que demanda e que concorrência — antes de investir no estoque." },
  { t: "Precificação", d: "O preço certo com comissão, frete e imposto descontados, de olho na margem real." },
  { t: "Estudo de concorrência", d: "Quem lidera a busca, quanto vende, com que logística e desde quando está no ar." },
];

export default function SobrePagina() {
  return (
    <>
      <SiteHeader voltar />

      <section className="border-b border-platina/70 bg-[#FAFBFF]">
        <div className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-platina bg-white px-3 py-1 text-[12.5px] text-aco">
            <Marca size={15} /> Consultoria de marketplaces
          </span>
          <h1 className="mt-5 max-w-[20ch] font-display text-[38px] font-semibold leading-[1.08] tracking-tight text-ink sm:text-[50px]">
            A Monvatti vive de fazer conta de marketplace dar certo.
          </h1>
          <p className="mt-5 max-w-[62ch] text-[18px] leading-relaxed text-aco">
            São mais de 150 clientes operados no dia a dia. Cada decisão de produto, preço e anúncio passa pela mesma
            inteligência que agora está dentro do <strong className="font-semibold text-ink">Monvatti Marketplaces</strong>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-conteudo px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">O que a Monvatti faz</h2>
            <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-aco">
              A consultoria cuida da operação inteira de quem vende em marketplace — e é dessa rotina que saíram as
              leituras da ferramenta.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {PILARES.map((p) => (
              <div key={p.t} className="rounded-2xl border border-platina bg-white p-6">
                <Marca size={22} />
                <h3 className="mt-4 font-display text-[17px] font-semibold text-ink">{p.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-aco">{p.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { n: "150+", l: "clientes atendidos" },
            { n: "3", l: "marketplaces no radar" },
            { n: "Diária", l: "operação de contas reais" },
            { n: "0", l: "preço mexido sem você" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-platina bg-white p-5">
              <p className="font-display text-[26px] font-semibold text-ink">{s.n}</p>
              <p className="mt-1 text-[13px] leading-snug text-aco">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-platina bg-nevoa/50 p-7 sm:p-10">
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink">
            Da consultoria para a sua tela.
          </h2>
          <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-aco">
            Você não precisa contratar a consultoria para ter a inteligência dela. O Monvatti Marketplaces coloca as
            mesmas leituras dentro do seu anúncio, no momento de decidir.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/#cadastro" className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo">
              Começar agora
            </Link>
            <Link href="/marketplaces" className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul">
              Ver os marketplaces
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-aco/70">
            Em breve, esta página vai levar também à landing da consultoria Monvatti.
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
