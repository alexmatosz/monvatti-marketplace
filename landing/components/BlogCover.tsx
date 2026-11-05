import type { Post } from "@/lib/novidades";

function Motivo({ nome }: { nome: Post["motivo"] }) {
  const comum = {
    fill: "none",
    stroke: "rgba(255,255,255,0.95)",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<Post["motivo"], React.ReactNode> = {
    grafico: <><path d="M6 34V10" {...comum} /><path d="M6 28l7-7 6 5 11-12" {...comum} /></>,
    rank: <><path d="M9 34V20M19 34V8M29 34V24" {...comum} /></>,
    sacola: <><path d="M10 15h20l-2 20H12L10 15Z" {...comum} /><path d="M15 15a5 5 0 0 1 10 0" {...comum} /></>,
    caixa: <><path d="M6 14l14-6 14 6-14 6-14-6Z" {...comum} /><path d="M6 14v12l14 6 14-6V14" {...comum} /></>,
    pix: <><path d="M20 6l14 14-14 14L6 20 20 6Z" {...comum} /><path d="M14 20h12M20 14v12" {...comum} /></>,
  };
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      {paths[nome]}
    </svg>
  );
}

export function BlogCover({ post, alto = false }: { post: Post; alto?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden ${alto ? "aspect-[16/9]" : "aspect-[16/10]"}`}
      style={{ background: `linear-gradient(135deg, ${post.cor} 0%, #070A1A 125%)` }}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/25 backdrop-blur">
        <Motivo nome={post.motivo} />
      </div>
      <span className="absolute bottom-5 left-5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold text-white ring-1 ring-white/25 backdrop-blur">
        {post.tag}
      </span>
    </div>
  );
}
