"use client";

import { useEffect, useRef, useState } from "react";
import { MONVATTI, linkInstitucional } from "@/lib/monvatti";

/* Marca o elemento como visível na primeira vez que ele entra na tela (uma vez só). */
function useNaTela<T extends Element>(margem = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) return setVisivel(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          io.disconnect();
        }
      },
      { rootMargin: margem, threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margem]);
  return [ref, visivel] as const;
}

function Surge({
  children,
  atraso = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const [ref, visivel] = useNaTela<HTMLDivElement>();
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      className={`revela ${visivel ? "visivel" : ""} ${className}`}
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {children}
    </Tag>
  );
}

/* Conta de 0 até o valor quando aparece na tela. */
function Contador({ valor }: { valor: number }) {
  const [ref, visivel] = useNaTela<HTMLSpanElement>();
  const [n, setN] = useState(valor);
  const reduzido = useRef(false);

  useEffect(() => {
    reduzido.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduzido.current) setN(0);
  }, []);

  useEffect(() => {
    if (!visivel || reduzido.current) return;
    let quadro = 0;
    const inicio = performance.now();
    const dur = 1600;
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / dur);
      setN(Math.round(valor * (1 - Math.pow(1 - p, 3))));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [visivel, valor]);

  return (
    <span ref={ref} className="tabular-nums" aria-label={`mais de ${valor}`}>
      +{n}
    </span>
  );
}

const PILARES = [
  {
    t: "Pesquisa de mercado",
    d: "Achar produto e nicho com dado, não com palpite.",
    icone: "M11 4a7 7 0 1 0 4.2 12.6l3.6 3.6 1.4-1.4-3.6-3.6A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z",
  },
  {
    t: "Precificação",
    d: "Preço que cobre comissão, frete e imposto e ainda deixa margem.",
    icone: "M3 12V4h8l10 10-8 8-10-10Zm4.5-6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  },
  {
    t: "Estudo de concorrência",
    d: "Quem vende, quanto vende e como se posiciona na busca.",
    icone: "M4 19h16v2H4v-2Zm1-2V9h3v8H5Zm5.5 0V4h3v13h-3ZM16 17v-6h3v6h-3Z",
  },
];

/* Foto da equipe: entra com um leve "zoom out" ao aparecer e aproxima de leve no hover. */
function FotoEquipe({ foto, atraso, principal }: { foto: (typeof MONVATTI.fotosEquipe)[number]; atraso: number; principal: boolean }) {
  const [ref, visivel] = useNaTela<HTMLElement>();
  return (
    <figure
      ref={ref}
      className={`revela group relative overflow-hidden rounded-[24px] bg-[#161B22] ${visivel ? "visivel" : ""}`}
      style={{ transitionDelay: `${atraso}ms` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${foto.base}-1200.webp`}
        srcSet={`${foto.base}-1200.webp 1200w, ${foto.base}-2000.webp 2000w`}
        sizes="(min-width: 1280px) 1100px, 100vw"
        width={foto.w}
        height={foto.h}
        alt={foto.alt}
        loading="lazy"
        decoding="async"
        style={principal ? { ["--proporcao" as string]: `${foto.w} / ${foto.h}` } : undefined}
        className={`h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03] motion-reduce:transition-none ${
          principal ? "aspect-[16/9] lg:aspect-[var(--proporcao)]" : "aspect-[16/10] object-[50%_40%] lg:aspect-[21/9]"
        } ${
          visivel ? "scale-100" : "scale-[1.08]"
        }`}
      />
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-4 pt-16 text-[14px] font-semibold text-white">
        {foto.legenda}
      </figcaption>
    </figure>
  );
}

/* Seção "quem faz": narrativa por rolagem, com a marca, o número de clientes, a rotina da equipe e as fotos reais. */
export function Institucional() {
  const link = linkInstitucional();
  const fotos = MONVATTI.fotosEquipe;

  return (
    <div className="overflow-hidden rounded-[32px] bg-card ring-1 ring-black/[0.04]">
      {/* 1. Marca + mensagem */}
      <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-16">
        <Surge className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(49,69,255,0.20),rgba(49,69,255,0.06)_45%,transparent_70%)]"
            aria-hidden="true"
          />
          <span className="absolute inset-[14%] rounded-full ring-1 ring-marca/15" aria-hidden="true" />
          <span className="absolute inset-[28%] rounded-full ring-1 ring-marca/10" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/marca.png" alt="Monvatti" width={400} height={273} className="relative h-auto w-[52%] drop-shadow-[0_18px_30px_rgba(0,26,216,0.25)]" />
        </Surge>

        <div>
          <Surge>
            <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-marca">Quem está por trás</p>
          </Surge>
          <Surge atraso={80}>
            <h2 className="mt-3 font-display text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-ink sm:text-[40px]">
              Feita por quem opera marketplace todo dia
            </h2>
          </Surge>
          <Surge atraso={160}>
            <p className="mt-4 max-w-[54ch] text-[16.5px] leading-relaxed text-aco">
              A Monvatti é a consultoria que opera mais de {MONVATTI.clientes} clientes em marketplaces. Pesquisa de mercado,
              precificação e estudo de concorrência fazem parte da rotina da equipe, e foi dessa rotina que a extensão nasceu.
            </p>
          </Surge>
          <Surge atraso={240}>
            <a
              href={link.href}
              {...(link.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="foco mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-black"
            >
              Conheça a Monvatti
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 10h10M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Surge>
        </div>
      </div>

      {/* 2. Dimensão da operação + rotina da equipe */}
      <div className="fundo-noite relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:p-16">
        <Surge className="flex flex-col justify-center">
          <p className="font-display text-[72px] font-black leading-none tracking-[-0.03em] text-white sm:text-[96px]">
            <Contador valor={MONVATTI.clientes} />
          </p>
          <p className="mt-3 max-w-[26ch] text-[17px] leading-snug text-white/70">clientes operados pela Monvatti em marketplaces</p>
          <span className="mt-6 block h-1 w-24 rounded-full bg-gradient-to-r from-marca to-[#7C8BFF]" aria-hidden="true" />
        </Surge>

        <ul className="grid gap-3">
          {PILARES.map((p, i) => (
            <Surge as="li" key={p.t} atraso={120 + i * 120}>
              <div className="flex items-start gap-4 rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08]">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-marca text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={p.icone} />
                  </svg>
                </span>
                <span>
                  <span className="block text-[17px] font-bold text-white">{p.t}</span>
                  <span className="mt-1 block text-[14.5px] leading-relaxed text-white/65">{p.d}</span>
                </span>
              </div>
            </Surge>
          ))}
        </ul>
      </div>

      {/* 3. A equipe, em fotos reais (lib/monvatti.ts) */}
      {fotos.length > 0 ? (
        <div className="p-8 sm:p-12 lg:p-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Surge>
              <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-marca">A equipe</p>
              <h3 className="mt-3 font-display text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">
                As pessoas por trás da Monvatti
              </h3>
            </Surge>
          </div>
          <div className="mt-8 grid gap-4 sm:gap-5">
            {fotos.map((f, i) => (
              <FotoEquipe key={f.base} foto={f} atraso={i * 150} principal={i === 0} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
