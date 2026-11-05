import { Logo, Marca } from "@/components/Logo";
import { Panel } from "@/components/Panel";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Signup } from "@/components/Signup";

function Icone({ nome }: { nome: string }) {
  const comum = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#001AD8", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grafico: <><path d="M4 19V5" /><path d="M4 15l5-5 4 3 7-7" /></>,
    busca: <><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /></>,
    calc: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h2M8 15h2M14 11h2M14 15h2" /></>,
    tend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
    rank: <><path d="M6 20V10M12 20V4M18 20v-7" /></>,
    caixa: <><path d="M3 8l9-4 9 4-9 4-9-4Z" /><path d="M3 8v8l9 4 9-4V8" /></>,
    planilha: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
    escudo: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /></>,
  };
  return <svg {...comum} aria-hidden="true">{paths[nome]}</svg>;
}

const FUNCOES = [
  { i: "grafico", t: "Métricas do anúncio", d: "Visitas, vendas por dia e por mês, conversão e faturamento estimado." },
  { i: "busca", t: "Concorrência na busca", d: "Quem disputa a 1ª e as demais páginas, com vendas e logística de cada um." },
  { i: "calc", t: "Calculadora de margem", d: "Comissão, taxa fixa, frete e imposto já descontados do seu preço." },
  { i: "tend", t: "Tendência por categoria", d: "Os produtos campeões de venda de cada categoria, pelo ranking do Mercado Livre." },
  { i: "rank", t: "Ranqueamento do anúncio", d: "Em que posição um anúncio aparece na busca para uma palavra-chave." },
  { i: "caixa", t: "Logística e tipo", d: "Full, Flex, Coleta ou Correios, e se o anúncio é Clássico ou Premium." },
  { i: "planilha", t: "Exportação para Excel", d: "Leve o estudo da busca inteira para uma planilha com um clique." },
  { i: "escudo", t: "Conta protegida", d: "O estudo roda pela sua conta vinculada; nunca alteramos preços dos seus anúncios." },
];

const PASSOS = [
  { t: "Instale a extensão", d: "Adicione a Monvatti ao Chrome e entre com o seu e-mail." },
  { t: "Vincule sua conta do Mercado Livre", d: "Uma autorização, uma vez. É ela que libera o estudo para você." },
  { t: "Abra qualquer anúncio", d: "O painel aparece sozinho na página, com tudo que você precisa para decidir." },
];

export default function Pagina() {
  return (
    <>
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-platina/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-conteudo items-center justify-between px-6">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-aco md:flex">
            <a className="foco hover:text-ink" href="#funcionalidades">Funcionalidades</a>
            <a className="foco hover:text-ink" href="#como">Como funciona</a>
            <a className="foco hover:text-ink" href="#planos">Planos</a>
            <a className="foco hover:text-ink" href="#faq">Dúvidas</a>
          </nav>
          <a href="#cadastro" className="foco rounded-xl bg-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-vivo">
            Começar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="malha absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto grid max-w-conteudo items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-platina bg-white px-3 py-1 text-[12.5px] text-aco">
              <Marca size={15} /> Da Monvatti · 40+ contas operadas no Mercado Livre
            </span>
            <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[52px]">
              A inteligência do seu anúncio, dentro da página do Mercado Livre.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-aco">
              Vendas estimadas do concorrente, métricas em tempo real, taxas e margem — tudo aparece no anúncio, sem planilha e sem sair da página.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#cadastro" className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo">
                Começar agora
              </a>
              <a href="#funcionalidades" className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul">
                Ver funcionalidades
              </a>
            </div>
          </div>
          <Panel />
        </div>
      </section>

      {/* Problemas */}
      <section className="border-y border-platina/70 bg-nevoa/60">
        <div className="mx-auto grid max-w-conteudo gap-8 px-6 py-12 sm:grid-cols-3">
          {[
            { t: "Não sabe o que vender?", d: "Veja a demanda e o quanto cada concorrente vende, por produto e categoria." },
            { t: "Concorrência te atropela?", d: "Descubra quem disputa a página e com que preço, logística e ritmo." },
            { t: "Perde tempo em planilha?", d: "Os números chegam prontos no anúncio e saem em Excel quando você quiser." },
          ].map((p) => (
            <div key={p.t}>
              <h3 className="font-display text-[17px] font-semibold text-ink">{p.t}</h3>
              <p className="mt-2 max-w-[42ch] text-[15px] leading-relaxed text-aco">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-conteudo px-6 py-20">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-ink">
            Tudo que você precisa para decidir, no próprio anúncio.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-aco">
            As mesmas leituras que a equipe da Monvatti usa todos os dias nas contas que opera.
          </p>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {FUNCOES.map((f) => (
            <div key={f.t} className="border-t border-platina pt-5">
              <Icone nome={f.i} />
              <h3 className="mt-3 text-[15.5px] font-semibold text-ink">{f.t}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-aco">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className="border-y border-platina/70 bg-[#FAFBFF]">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <h2 className="font-display text-[32px] font-semibold tracking-tight text-ink">Em três passos.</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {PASSOS.map((p, idx) => (
              <li key={p.t} className="relative">
                <span className="tnum font-display text-[15px] font-semibold text-azul">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-display text-[18px] font-semibold text-ink">{p.t}</h3>
                <p className="mt-1.5 max-w-[38ch] text-[15px] leading-relaxed text-aco">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-night">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <div className="mb-10 text-center">
            <h2 className="font-display text-[32px] font-semibold tracking-tight text-white">Escolha o seu plano.</h2>
            <p className="mt-3 text-[16px] text-white/60">Sem fidelidade. Cancele quando quiser.</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* Cadastro */}
      <section id="cadastro" className="mx-auto max-w-conteudo px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-ink">
              Comece a estudar seus anúncios hoje.
            </h2>
            <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-aco">
              Cadastre-se com o seu e-mail. É ele que vai liberar o seu acesso na extensão assim que o pagamento abrir.
            </p>
          </div>
          <Signup />
        </div>
      </section>

      {/* Dúvidas */}
      <section id="faq" className="border-t border-platina/70 bg-[#FAFBFF]">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <h2 className="font-display text-[32px] font-semibold tracking-tight text-ink">Dúvidas frequentes.</h2>
          <div className="mt-8 max-w-[720px]">
            <Faq />
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-platina/70 bg-white">
        <div className="mx-auto flex max-w-conteudo flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <Logo />
            <p className="mt-2 max-w-[52ch] text-[13px] text-aco">
              Inteligência de anúncios para o Mercado Livre. As vendas estimadas são aproximações a partir de números públicos, não dados oficiais do Mercado Livre.
            </p>
          </div>
          <p className="text-[12px] text-aco">© {new Date().getFullYear()} Monvatti</p>
        </div>
      </footer>
    </>
  );
}
