import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacidade — Monvatti Marketplaces",
  description: "Quais dados a extensão Monvatti Marketplace usa, para quê e como pedir a exclusão.",
};

// Contato do responsável pelos dados. Confirme antes de publicar.
const CONTATO = "alexmonvatti@gmail.com";
const ATUALIZADA = "11 de novembro de 2026";

const SECOES: { t: string; p: string[] }[] = [
  {
    t: "Quem somos",
    p: ["O Monvatti Marketplace é uma extensão do Chrome da Monvatti para estudar anúncios do Mercado Livre. Esta política vale para a extensão, para este site e para o servidor que os atende."],
  },
  {
    t: "Dados que coletamos",
    p: [
      "Cadastro e acesso: nome e e-mail informados na compra, datas de pagamento e de validade do acesso, e os códigos de login que enviamos ao seu e-mail (guardamos só uma versão cifrada, que vence em minutos).",
      "Pagamento: o Pix e o cartão são processados pelo nosso parceiro de pagamentos. Não recebemos nem guardamos dados bancários ou de cartão; recebemos só a confirmação de que a cobrança foi paga.",
      "Uso da extensão: quando você abre um anúncio ou uma busca no Mercado Livre, a extensão lê os dados públicos da página (título, preço, vendidos, vendedor, logística) e os envia ao nosso servidor para calcular estimativas, taxas e margem. Guardamos essas leituras de anúncios públicos para montar históricos.",
      "Conta do Mercado Livre no navegador: a extensão lê o número da conta do Mercado Livre que está logada no seu navegador apenas para identificar a sessão; não lemos senha, mensagens, compras nem dados pessoais da sua conta.",
    ],
  },
  {
    t: "O que não fazemos",
    p: [
      "Não vendemos nem compartilhamos seus dados com terceiros para publicidade.",
      "Não alteramos anúncios, preços ou qualquer coisa na sua conta do Mercado Livre.",
      "Não lemos páginas fora do Mercado Livre.",
    ],
  },
  {
    t: "Para que usamos",
    p: ["Liberar e manter o seu acesso, enviar o código de login e avisos sobre a sua assinatura, calcular os dados mostrados na extensão e dar suporte."],
  },
  {
    t: "Por quanto tempo guardamos",
    p: ["Os dados de cadastro ficam enquanto você tiver conta conosco. Os códigos de login vencem em minutos. Você pode pedir a exclusão a qualquer momento."],
  },
  {
    t: "Seus direitos (LGPD)",
    p: [`Você pode pedir acesso, correção ou exclusão dos seus dados escrevendo para ${CONTATO}. Respondemos em até 15 dias.`],
  },
];

export default function PrivacidadePagina() {
  return (
    <>
      <SiteHeader voltar />
      <section className="mx-auto max-w-conteudo px-6 py-16 sm:py-20">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-azul">Privacidade</p>
        <h1 className="mt-2 font-display text-[36px] font-extrabold leading-[1.04] tracking-tight text-ink sm:text-[46px]">
          Política de privacidade
        </h1>
        <p className="mt-3 text-[13px] text-aco">Atualizada em {ATUALIZADA}.</p>
        <div className="mt-10 grid max-w-[760px] gap-9">
          {SECOES.map((s) => (
            <div key={s.t}>
              <h2 className="font-display text-[20px] font-bold tracking-tight text-ink">{s.t}</h2>
              {s.p.map((x) => (
                <p key={x.slice(0, 40)} className="mt-2 text-[15px] leading-relaxed text-aco">{x}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
