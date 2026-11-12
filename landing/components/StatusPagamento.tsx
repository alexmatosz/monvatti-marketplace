"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const LINK_PADRAO = process.env.NEXT_PUBLIC_LINK_EXTENSAO || "";

// Pergunta ao servidor se o Pix já caiu (o AbacatePay avisa em segundos) e mostra o botão de instalar.
export function StatusPagamento() {
  const [email, setEmail] = useState("");
  const [liberado, setLiberado] = useState<boolean | null>(null);
  const [link, setLink] = useState(LINK_PADRAO);
  const [teste, setTeste] = useState(false);

  useEffect(() => {
    let salvo = "";
    try {
      salvo = localStorage.getItem("monvatti_email") || "";
    } catch {}
    setEmail(salvo);
    if (!salvo) return;
    let tentativas = 0;
    let parar = false;
    const conferir = async () => {
      try {
        const r = await fetch(`${API}/api/pagamento/situacao?email=${encodeURIComponent(salvo)}`, { cache: "no-store" });
        const d = await r.json();
        if (d.link_extensao) setLink(d.link_extensao);
        setTeste(!!d.teste);
        setLiberado(!!d.liberado);
        if (d.liberado) return;
      } catch {}
      if (!parar && ++tentativas < 40) setTimeout(conferir, 4000);
    };
    conferir();
    return () => {
      parar = true;
    };
  }, []);

  const botao = link ? (
    <a href={link} target="_blank" rel="noopener" className="foco inline-block rounded-xl bg-marca px-6 py-3 text-sm font-semibold text-white hover:bg-marca-forte">
      Instalar no Chrome
    </a>
  ) : null;

  // Enquanto a extensão não está na Chrome Web Store, o teste instala pelo arquivo .zip.
  const instalarTeste =
    teste && !link ? (
      <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-platina">
        <a
          href="/download/monvatti-extensao-teste.zip"
          className="foco inline-block rounded-xl bg-marca px-6 py-3 text-sm font-semibold text-white hover:bg-marca-forte"
        >
          Baixar a extensão (teste)
        </a>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-[13.5px] leading-relaxed text-aco">
          <li>Extraia o arquivo baixado numa pasta (botão direito → Extrair tudo).</li>
          <li>
            No Chrome, abra <b className="text-ink">chrome://extensions</b> e ligue o <b className="text-ink">Modo do desenvolvedor</b>,
            no canto superior direito.
          </li>
          <li>
            Clique em <b className="text-ink">Carregar sem compactação</b> e escolha a pasta extraída.
          </li>
          <li>Fixe o ícone da Monvatti na barra do Chrome e entre com o seu e-mail.</li>
        </ol>
        <p className="mt-2 text-[12px] text-aco">Na versão final a instalação é direto pela Chrome Web Store, com um clique.</p>
      </div>
    ) : null;

  if (liberado) {
    return (
      <div className="rounded-2xl border border-[#0f8a5f]/25 bg-[#e3f6ee] p-6">
        <p className="font-display text-lg font-semibold text-[#0f8a5f]">
          {teste ? "Acesso de teste liberado." : "Pagamento confirmado. Seu acesso está liberado."}
        </p>
        <p className="mt-1 text-[15px] text-ink">Entre na extensão com <b>{email}</b>.</p>
        {botao && <div className="mt-4">{botao}</div>}
        {instalarTeste}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-platina bg-nevoa p-6">
      <p className="font-display text-lg font-semibold text-ink">
        {email ? "Confirmando o seu pagamento…" : "Assim que o pagamento for aprovado, seu acesso é liberado."}
      </p>
      <p className="mt-1 text-[15px] text-aco">
        {email
          ? `Costuma levar poucos segundos. Você vai entrar com ${email}.`
          : "Você recebe um e-mail com o link da extensão. Entre com o mesmo e-mail usado no pagamento."}
      </p>
      {botao && <div className="mt-4">{botao}</div>}
    </div>
  );
}
