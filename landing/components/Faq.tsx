"use client";

import { useState } from "react";

const ITENS = [
  {
    q: "Como a Monvatti Marketplaces se conecta ao Mercado Livre?",
    a: "Você instala a extensão no Chrome e entra com o e-mail da compra, confirmando com um código que chega no seu e-mail. A partir daí o painel aparece sozinho dentro dos anúncios e da busca.",
  },
  {
    q: "Quais marketplaces já funcionam?",
    a: "Hoje, o Mercado Livre por completo. Shopee e Amazon estão a caminho — na Amazon entra também o Buy Box e o preço para ganhar a caixa de compra. Quem assina o Combo recebe os canais novos assim que saem.",
  },
  {
    q: "Preciso de conhecimento técnico?",
    a: "Não. É instalar a extensão e entrar com o seu e-mail. O resto aparece na própria página do Mercado Livre.",
  },
  {
    q: "As vendas estimadas são números oficiais?",
    a: "Não. São estimativas a partir do número público do anúncio (“+50 vendidos”, “+1 mil vendidos”). Servem para comparar concorrentes, não como dado oficial do Mercado Livre.",
  },
  {
    q: "Posso usar em mais de uma conta?",
    a: "O acesso é pessoal e fica ligado ao e-mail da compra, um computador por vez: se você entrar em outro, o primeiro é desconectado. Funciona em qualquer anúncio do Mercado Livre que você abrir.",
  },
  {
    q: "Qual navegador é compatível?",
    a: "Google Chrome (e navegadores baseados em Chromium). A extensão roda dentro do Mercado Livre.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A assinatura é sem fidelidade — você cancela quando quiser e mantém o acesso até o fim do período pago.",
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="border-b border-platina/70">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="foco flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[15px] font-medium text-ink">{q}</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className={`flex-none text-aco transition-transform ${aberto ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {aberto ? <p className="max-w-[60ch] pb-5 text-[15px] leading-relaxed text-aco">{a}</p> : null}
    </div>
  );
}

export function Faq() {
  return (
    <div>
      {ITENS.map((it) => (
        <Item key={it.q} {...it} />
      ))}
    </div>
  );
}
