import { Logo, Marca } from "@/components/Logo";
import { Panel } from "@/components/Panel";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Signup } from "@/components/Signup";
import { Reveal } from "@/components/Reveal";
import { SeloMarketplace, ConcorrenciaMock, CalculadoraMock, TendenciaMock } from "@/components/Mockups";

function Icone({ nome }: { nome: string }) {
  const comum = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "#001AD8", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grafico: <><path d="M4 19V5" /><path d="M4 15l5-5 4 3 7-7" /></>,
    rank: <><path d="M6 20V10M12 20V4M18 20v-7" /></>,
    caixa: <><path d="M3 8l9-4 9 4-9 4-9-4Z" /><path d="M3 8v8l9 4 9-4V8" /></>,
    planilha: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
    escudo: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /></>,
    relogio: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  };
  return <svg {...comum} aria-hidden="true">{paths[nome]}</svg>;
}

const GRID = [
  { i: "grafico", t: "Métricas do anúncio", d: "Visitas, vendas por dia e por mês, conversão e faturamento estimado." },
  { i: "rank", t: "Ranqueamento do anúncio", d: "Em que posição um anúncio aparece na busca para uma palavra-chave." },
  { i: "caixa", t: "Logística e tipo", d: "Full, Flex, Coleta ou Correios, e se o anúncio é Clássico ou Premium." },
  { i: "planilha", t: "Exportação para Excel", d: "Leve o estudo da busca inteira para uma planilha com um clique." },
  { i: "relogio", t: "Histórico do anúncio", d: "Acompanhe vendas, preço e visitas de um anúncio dia após dia." },
  { i: "escudo", t: "Conta protegida", d: "Roda pela sua conta vinculada; nunca alteramos preços dos seus anúncios." },
];

const PASSOS = [
  { t: "Instale a extensão", d: "Adicione a Monvatti ao Chrome e entre com o seu e-mail." },
  { t: "Vincule sua conta", d: "Uma autorização, uma vez. É ela que libera o estudo para você." },
  { t: "Abra qualquer anúncio", d: "O painel aparece sozinho na página, com tudo para você decidir." },
];

const PILARES = [
  { t: "Pesquisa de mercado", d: "Que produto vender, com que demanda e que concorrência — antes de investir no estoque." },
  { t: "Precificação", d: "O preço certo com comissão, frete e imposto descontados, de olho na margem real." },
  { t: "Estudo de concorrência", d: "Quem lidera a busca, quanto vende, com que logística e desde quando está no ar." },
];

function Showcase({
  titulo,
  texto,
  mock,
  invertido = false,
  shopee = true,
}: {
  titulo: string;
  texto: string;
  mock: React.ReactNode;
  invertido?: boolean;
  shopee?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 py-12 lg:grid-cols-2">
      <Reveal className={invertido ? "lg:order-2" : ""}>
        <div className="mb-3 flex flex-wrap gap-2">
          <SeloMarketplace nome="Mercado Livre" />
          {shopee ? <SeloMarketplace nome="Shopee" breve /> : null}
        </div>
        <h3 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">{titulo}</h3>
        <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-aco">{texto}</p>
      </Reveal>
      <Reveal delay={80} className={invertido ? "lg:order-1" : ""}>
        {mock}
      </Reveal>
    </div>
  );
}

function ExemploPlaceholder({ titulo, legenda }: { titulo: string; legenda: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-platina bg-white">
      <div className="grid grid-cols-2">
        {["Antes", "Depois"].map((fase) => (
          <div
            key={fase}
            className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 border-platina text-center ${
              fase === "Antes" ? "border-r bg-[#FAFBFF]" : "bg-nevoa/50"
            }`}
          >
            <span className="text-[12px] font-semibold text-azul">{fase}</span>
            <span className="text-[11px] text-aco/70">print em breve</span>
          </div>
        ))}
      </div>
      <div className="border-t border-platina px-4 py-3">
        <p className="text-[14px] font-semibold text-ink">{titulo}</p>
        <p className="mt-0.5 text-[13px] text-aco">{legenda}</p>
      </div>
    </div>
  );
}

export default function Pagina() {
  return (
    <>
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-platina/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-conteudo items-center justify-between px-6">
          <a href="#topo" className="foco"><Logo h={24} /></a>
          <nav className="hidden items-center gap-7 text-sm text-aco md:flex">
            <a className="foco hover:text-ink" href="#monvatti">A Monvatti</a>
            <a className="foco hover:text-ink" href="#funcionalidades">Funcionalidades</a>
            <a className="foco hover:text-ink" href="#planos">Planos</a>
            <a className="foco hover:text-ink" href="#faq">Dúvidas</a>
          </nav>
          <a href="#cadastro" className="foco rounded-xl bg-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-vivo">
            Começar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section id="topo" className="relative overflow-hidden">
        <div className="malha absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto grid max-w-conteudo items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-platina bg-white px-3 py-1 text-[12.5px] text-aco">
              <Marca size={15} /> A ferramenta da Monvatti · 40+ contas no Mercado Livre
            </span>
            <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-[52px]">
              A inteligência do seu anúncio, dentro da página do marketplace.
            </h1>
            <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-aco">
              Vendas estimadas do concorrente, métricas em tempo real, taxas e margem — tudo aparece no anúncio, sem planilha e sem sair da página.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <SeloMarketplace nome="Mercado Livre" />
              <SeloMarketplace nome="Shopee" breve />
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#cadastro" className="foco rounded-xl bg-azul px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-vivo">
                Começar agora
              </a>
              <a href="#funcionalidades" className="foco rounded-xl border border-platina bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-azul">
                Ver funcionalidades
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Panel />
          </Reveal>
        </div>
      </section>

      {/* A Monvatti */}
      <section id="monvatti" className="border-y border-platina/70 bg-night">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <Reveal>
            <div className="max-w-[60ch]">
              <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-white">
                A mesma inteligência que faz a Monvatti dar resultado.
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-white/70">
                A Monvatti é a agência que opera mais de 40 contas no Mercado Livre. O que a gente faz todo dia para os clientes
                — pesquisa de mercado, precificação e estudo de concorrência — virou uma ferramenta. É ela que você usa agora.
              </p>
            </div>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {PILARES.map((p, i) => (
              <Reveal key={p.t} delay={i * 80}>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <Marca size={22} tom="branca" />
                  <h3 className="mt-4 font-display text-[18px] font-semibold text-white">{p.t}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-conteudo px-6 py-20">
        <Reveal>
          <div className="max-w-[46ch]">
            <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-ink">
              Tudo para decidir, dentro do próprio anúncio.
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-aco">
              As mesmas leituras que a equipe da Monvatti usa todos os dias. Hoje no Mercado Livre; em breve, na Shopee.
            </p>
          </div>
        </Reveal>

        <div className="mt-6 divide-y divide-platina/70">
          <Showcase
            titulo="Veja a concorrência inteira da busca"
            texto="Quem disputa a 1ª e as demais páginas, com vendas estimadas, preço, logística e há quanto tempo cada anúncio está no ar. Exporte tudo para o Excel quando quiser."
            mock={<ConcorrenciaMock />}
          />
          <Showcase
            titulo="Precifique com a margem real"
            texto="Comissão, taxa fixa, frete grátis e imposto já descontados do seu preço. Você vê o lucro líquido e a margem antes de publicar — nada de surpresa no fim do mês."
            mock={<CalculadoraMock />}
            invertido
          />
          <Showcase
            titulo="Descubra o que mais vende"
            texto="O ranking oficial de mais vendidos de cada categoria, para achar oportunidade de produto com alta demanda antes de investir no estoque."
            mock={<TendenciaMock />}
          />
        </div>

        <div className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {GRID.map((f, i) => (
            <Reveal key={f.t} delay={(i % 3) * 70}>
              <div className="border-t border-platina pt-5">
                <Icone nome={f.i} />
                <h3 className="mt-3 text-[15.5px] font-semibold text-ink">{f.t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-aco">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Exemplos reais */}
      <section className="border-y border-platina/70 bg-[#FAFBFF]">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <Reveal>
            <div className="max-w-[46ch]">
              <h2 className="font-display text-[32px] font-semibold tracking-tight text-ink">Antes e depois, de verdade.</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-aco">
                Casos reais de clientes da Monvatti — pesquisa, precificação e estudo que viraram resultado. (Imagens em breve.)
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { t: "Pesquisa de mercado", l: "De “não sei o que vender” a um produto validado." },
              { t: "Precificação", l: "De margem no escuro a lucro líquido previsível." },
              { t: "Estudo de concorrência", l: "Do achismo ao anúncio que sobe na busca." },
            ].map((e, i) => (
              <Reveal key={e.t} delay={i * 80}>
                <ExemploPlaceholder titulo={e.t} legenda={e.l} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-conteudo px-6 py-20">
        <Reveal>
          <h2 className="font-display text-[32px] font-semibold tracking-tight text-ink">Em três passos.</h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {PASSOS.map((p, idx) => (
            <Reveal key={p.t} delay={idx * 90}>
              <li className="relative list-none">
                <span className="tnum font-display text-[15px] font-semibold text-azul">{String(idx + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-display text-[18px] font-semibold text-ink">{p.t}</h3>
                <p className="mt-1.5 max-w-[38ch] text-[15px] leading-relaxed text-aco">{p.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-night">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <Reveal>
            <div className="mb-10 text-center">
              <h2 className="font-display text-[32px] font-semibold tracking-tight text-white">Escolha o seu plano.</h2>
              <p className="mt-3 text-[16px] text-white/60">Mercado Livre hoje, Shopee em breve. Sem fidelidade.</p>
            </div>
          </Reveal>
          <Pricing />
        </div>
      </section>

      {/* Cadastro */}
      <section id="cadastro" className="mx-auto max-w-conteudo px-6 py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-ink">
                Comece a estudar seus anúncios hoje.
              </h2>
              <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-aco">
                Cadastre-se com o seu e-mail. É ele que vai liberar o seu acesso na extensão assim que o pagamento abrir.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <Signup />
          </Reveal>
        </div>
      </section>

      {/* Dúvidas */}
      <section id="faq" className="border-t border-platina/70 bg-[#FAFBFF]">
        <div className="mx-auto max-w-conteudo px-6 py-20">
          <Reveal>
            <h2 className="font-display text-[32px] font-semibold tracking-tight text-ink">Dúvidas frequentes.</h2>
          </Reveal>
          <div className="mt-8 max-w-[720px]">
            <Faq />
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <footer className="border-t border-platina/70 bg-white">
        <div className="mx-auto flex max-w-conteudo flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div>
            <Logo h={22} />
            <p className="mt-3 max-w-[52ch] text-[13px] text-aco">
              Inteligência de anúncios para o Mercado Livre e, em breve, a Shopee. As vendas estimadas são aproximações a partir de números públicos, não dados oficiais dos marketplaces.
            </p>
          </div>
          <p className="text-[12px] text-aco">© {new Date().getFullYear()} Monvatti</p>
        </div>
      </footer>
    </>
  );
}
