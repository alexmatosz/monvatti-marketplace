import { Marca } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Print } from "@/components/Print";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Demonstracao } from "@/components/Demonstracao";
import { Institucional } from "@/components/Institucional";
import { MarcaMarketplace } from "@/components/Marcas";
import { PassoInstalar, PassoCodigo, PassoPainel } from "@/components/Mockups";

function Icone({ nome }: { nome: string }) {
  const comum = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    grafico: <><path d="M4 19V5" /><path d="M4 15l5-5 4 3 7-7" /></>,
    moeda: <><circle cx="12" cy="12" r="8" /><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6.5v11" /></>,
    lupa: <><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>,
    rank: <><path d="M6 20V10M12 20V4M18 20v-7" /></>,
    planilha: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
    escudo: <><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="M9 12l2 2 4-4" /></>,
  };
  return <svg {...comum} aria-hidden="true">{paths[nome]}</svg>;
}

const RECURSOS = [
  { i: "grafico", t: "Vendas do concorrente", d: "Vendas estimadas, ritmo atual e faturamento de qualquer anúncio, direto na página dele." },
  { i: "moeda", t: "Taxas e margem real", d: "Comissão, taxa fixa, frete e imposto já descontados. Você vê quanto sobra de cada venda." },
  { i: "lupa", t: "Concorrência da busca", d: "Quem lidera a 1ª e as demais páginas, com logística, idade do anúncio e vendedor." },
  { i: "rank", t: "Ranqueamento", d: "Em que posição um anúncio aparece na busca para a palavra-chave que você escolher." },
  { i: "planilha", t: "Estudo em Excel", d: "A busca inteira numa planilha com um clique: preço, venda por dia e por mês, frete e margem." },
  { i: "escudo", t: "Só leitura", d: "A extensão nunca mexe nos seus anúncios nem nos seus preços. Ela só mostra os números." },
];

const DESTAQUES = ["Vendas estimadas", "Taxas e margem", "Concorrência", "Excel"];

const PASSOS = [
  { t: "Instale a extensão", d: "Adicione ao Chrome em poucos segundos.", mock: <PassoInstalar /> },
  { t: "Entre com o código", d: "Digite o e-mail da compra e cole o código de 6 números que chega nele.", mock: <PassoCodigo /> },
  { t: "Abra um anúncio", d: "O painel aparece sozinho no anúncio e na busca do Mercado Livre.", mock: <PassoPainel /> },
];

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 10.5 3.2 3.2L15 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

const titulo2 = "font-display text-[36px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[46px]";

export default function Pagina() {
  return (
    <>
      <SiteHeader sobreposto />

      {/* Topo: escuro com brilho azul e a tela real da extensão num recorte orgânico. */}
      <section id="topo" className="folha noite fundo-noite relative z-50 overflow-hidden">
        <div className="mx-auto grid max-w-conteudo items-center gap-14 px-6 pb-24 pt-36 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-40">
          <div>
            <div className="flex items-center gap-2.5 text-[14px] text-aco">
              <Marca tom="branca" size={18} />
              <span>Uma ferramenta da Monvatti</span>
            </div>
            <h1 className="mt-5 font-display text-[44px] font-black leading-[1.02] tracking-[-0.02em] text-white sm:text-[60px]">
              Os números do anúncio, dentro do anúncio.
            </h1>
            <p className="mt-6 max-w-[48ch] text-[18px] leading-relaxed text-aco">
              A extensão da Monvatti mostra vendas estimadas, taxas, margem e concorrência na própria página do Mercado Livre.
              Sem planilha e sem trocar de aba.
            </p>
            <ul className="mt-7 inline-flex flex-wrap gap-x-5 gap-y-2 rounded-[22px] bg-white/[0.07] px-5 py-2.5 text-[13.5px] font-medium text-white/85 ring-1 ring-white/10">
              {DESTAQUES.map((d) => (
                <li key={d} className="flex items-center gap-1.5">
                  <span className="text-[#8A98FF]"><Check /></span>
                  {d}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#planos" className="foco inline-flex items-center gap-2 rounded-full bg-marca px-7 py-4 text-[15.5px] font-bold text-white transition-colors hover:bg-marca-forte">
                Assinar agora
              </a>
              <a href="#demonstracao" className="foco rounded-full px-7 py-4 text-[15.5px] font-bold text-white ring-1 ring-white/30 transition-colors hover:bg-white/[0.06]">
                Ver a extensão
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
              {[
                ["+150", "clientes operados pela Monvatti"],
                ["R$ 44,90", "por mês no Pix"],
                ["Até 12x", "no cartão"],
              ].map(([n, l], i) => (
                <div key={l} className={i > 0 ? "border-l border-white/15 pl-8" : ""}>
                  <p className="font-display text-[26px] font-bold leading-none text-white">{n}</p>
                  <p className="mt-1.5 text-[13px] text-aco">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="recorte absolute inset-x-0 bottom-[-6%] top-[8%] bg-[linear-gradient(150deg,rgba(255,255,255,0.045),rgba(255,255,255,0.01))] ring-1 ring-white/[0.06]" aria-hidden="true" />
            <div className="relative px-10 pt-2 sm:px-14">
              <Print nome="painelVendas" prioridade maxW={380} tom="escuro" className="mx-auto brightness-[0.94]" />
            </div>
          </div>
        </div>
      </section>

      {/* Onde funciona */}
      <section className="folha relative z-40 bg-card">
        <div className="mx-auto flex max-w-conteudo flex-col items-center gap-8 px-6 pb-16 pt-16 lg:flex-row lg:justify-between">
          <p className="max-w-[32ch] text-center text-[16px] font-medium text-aco lg:text-left">
            Funciona no marketplace onde você vende. Mercado Livre hoje, Shopee e Amazon a caminho.
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {(["Mercado Livre", "Shopee", "Amazon"] as const).map((m) => (
              <li key={m} className="flex items-center gap-3 rounded-2xl bg-fundo px-5 py-3.5 ring-1 ring-black/[0.04]">
                <MarcaMarketplace nome={m} tamanho={36} />
                <span>
                  <span className="block text-[15px] font-bold text-ink">{m}</span>
                  <span className={`block text-[12.5px] font-medium ${m === "Mercado Livre" ? "text-[#0F8A5F]" : "text-aco"}`}>
                    {m === "Mercado Livre" ? "Disponível" : "Em breve"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="folha relative z-30 bg-fundo">
        <div className="mx-auto max-w-conteudo px-6 pb-24 pt-24">
          <div className="mx-auto max-w-[640px] text-center">
            <h2 className={`${titulo2} text-ink`}>Tudo o que você precisa para decidir o que vender</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-aco">
              As mesmas leituras que a equipe da Monvatti usa todos os dias com mais de 150 clientes, agora no seu navegador.
            </p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {RECURSOS.map((r) => (
              <div key={r.t} className="rounded-[24px] bg-card p-8 ring-1 ring-black/[0.04]">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marca text-white">
                  <Icone nome={r.i} />
                </span>
                <h3 className="mt-7 text-[20px] font-bold tracking-tight text-ink">{r.t}</h3>
                <p className="mt-2.5 text-[15.5px] leading-relaxed text-aco">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demonstração com as telas reais */}
      <section id="demonstracao" className="folha relative z-20 bg-card">
        <div className="mx-auto max-w-conteudo px-6 pb-24 pt-24">
          <div className="mx-auto mb-10 max-w-[620px] text-center">
            <h2 className={`${titulo2} text-ink`}>Veja a extensão funcionando</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-aco">Telas reais, capturadas numa busca por fone de ouvido bluetooth.</p>
          </div>
          <Demonstracao />
        </div>
      </section>

      {/* Como começar + planos: faixa escura */}
      <section id="planos" className="folha noite fundo-noite relative z-10">
        <div className="mx-auto max-w-conteudo px-6 pb-24 pt-28">
          <div className="mx-auto max-w-[620px] text-center">
            <h2 className={`${titulo2} text-white`}>Em três passos, do Chrome ao anúncio</h2>
            <p className="mt-4 text-[17px] leading-relaxed text-aco">Sem configuração e sem senha para decorar.</p>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.t} className="rounded-[24px] bg-white/[0.05] p-6 ring-1 ring-white/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marca text-[14px] font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 text-[19px] font-bold text-white">{p.t}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-aco">{p.d}</p>
                <div className="mt-5">{p.mock}</div>
              </li>
            ))}
          </ol>

          <div className="mx-auto mb-10 mt-28 max-w-[620px] text-center">
            <h2 className={`${titulo2} text-white`}>Escolha o seu plano</h2>
            <p className="mt-4 text-[17px] text-aco">Pix com 10% de desconto ou cartão em até 12x. Sem fidelidade.</p>
          </div>
          <Pricing />
        </div>
      </section>

      {/* Quem faz, dúvidas e chamada final */}
      <section className="folha relative z-0 bg-fundo">
        <div className="mx-auto max-w-conteudo px-6 pb-24 pt-28">
          <Institucional />

          <div id="faq" className="mt-24 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <h2 className="font-display text-[36px] font-bold leading-[1.08] tracking-[-0.02em] text-ink sm:text-[42px]">Dúvidas frequentes</h2>
            <Faq />
          </div>

          <div className="relative mt-24 overflow-hidden rounded-[32px] bg-marca p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 flex-col gap-5 md:flex" aria-hidden="true">
              <span className="ml-24 block h-16 w-[420px] rounded-full border-2 border-white/25" />
              <span className="block h-16 w-[460px] rounded-full bg-[#001AD8]" />
              <span className="ml-16 block h-16 w-[420px] rounded-full border-2 border-white/25" />
              <span className="ml-8 block h-16 w-[440px] rounded-full bg-[#161B22]/80" />
            </div>
            <div className="relative max-w-[520px]">
              <h2 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.02em] text-white sm:text-[42px]">
                Pronto para estudar seus anúncios?
              </h2>
              <p className="mt-4 text-[17px] leading-relaxed text-white/80">
                Assine, instale e abra qualquer anúncio do Mercado Livre. Os números já estão lá.
              </p>
              <a href="#planos" className="foco mt-8 inline-flex rounded-full bg-[#161B22] px-7 py-4 text-[15.5px] font-bold text-white transition-colors hover:bg-black">
                Assinar agora
              </a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
