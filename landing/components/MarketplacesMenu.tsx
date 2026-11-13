"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CANAIS } from "@/lib/canais";
import { MarcaMarketplace } from "@/components/Marcas";

export function MarketplacesMenu() {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    function fora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setAberto(true)} onMouseLeave={() => setAberto(false)}>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="menu"
        className="foco inline-flex items-center gap-1 whitespace-nowrap text-sm text-aco transition-colors hover:text-ink"
      >
        Marketplaces
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className={`transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 w-[300px] -translate-x-1/2 pt-3"
        >
          <div className="overflow-hidden rounded-2xl border border-platina bg-card p-1.5 shadow-[0_24px_60px_-24px_rgba(7,10,26,0.45)]">
            {CANAIS.map((c) => (
              <Link
                key={c.id}
                href={`/marketplaces/${c.id}`}
                role="menuitem"
                onClick={() => setAberto(false)}
                className="foco flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-nevoa"
              >
                <MarcaMarketplace nome={c.id} tamanho={32} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-ink">{c.nome}</span>
                    {c.estado === "breve" ? (
                      <span className="rounded-full bg-platina/60 px-1.5 py-0.5 text-[10px] font-semibold text-aco">em breve</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-aco">{c.diferencial.split(":")[0]}</span>
                </span>
              </Link>
            ))}
            <Link
              href="/marketplaces"
              onClick={() => setAberto(false)}
              className="foco mt-1 block rounded-xl px-3 py-2 text-[12.5px] font-semibold text-azul transition-colors hover:bg-nevoa"
            >
              Ver todos os canais
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
