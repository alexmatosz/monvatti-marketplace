import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BlogCover } from "@/components/BlogCover";
import { POSTS, postPorSlug } from "@/lib/novidades";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = postPorSlug(params.slug);
  if (!post) return { title: "Novidades — Monvatti Marketplaces" };
  return { title: `${post.titulo} — Novidades`, description: post.resumo };
}

export default function PostPagina({ params }: { params: { slug: string } }) {
  const post = postPorSlug(params.slug);
  if (!post) notFound();

  const outros = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <SiteHeader voltar />
      <article className="mx-auto max-w-[760px] px-6 py-14 sm:py-16">
        <Link href="/novidades" className="foco text-[13px] font-medium text-azul hover:underline">
          ← Todas as novidades
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="rounded-full bg-nevoa px-2.5 py-0.5 text-[12px] font-semibold text-azul">{post.tag}</span>
          <span className="text-[13px] text-aco">{post.data}</span>
        </div>
        <h1 className="mt-3 font-display text-[32px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[40px]">
          {post.titulo}
        </h1>

        <div className="mt-8 overflow-hidden rounded-3xl border border-platina">
          <BlogCover post={post} alto />
        </div>

        <div className="mt-8 space-y-5">
          {post.corpo.map((p, i) => (
            <p key={i} className="text-[17px] leading-relaxed text-ink/85">{p}</p>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-platina bg-nevoa/50 p-7">
          <h2 className="font-display text-[20px] font-semibold text-ink">Quer usar isso nos seus anúncios?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-aco">
            Cadastre-se com o seu e-mail e comece a estudar seus anúncios com o Monvatti Marketplaces.
          </p>
          <Link href="/#planos" className="foco mt-5 inline-block rounded-xl bg-marca px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-marca-forte">
            Começar agora
          </Link>
        </div>

        <div className="mt-12 border-t border-platina pt-8">
          <p className="text-[13px] font-medium text-aco">Continue lendo</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {outros.map((p) => (
              <Link
                key={p.slug}
                href={`/novidades/${p.slug}`}
                className="foco group flex items-center gap-4 rounded-2xl border border-platina bg-card p-3 transition-colors hover:border-azul"
              >
                <div className="h-16 w-24 flex-none overflow-hidden rounded-xl">
                  <BlogCover post={p} />
                </div>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold text-ink">{p.titulo}</span>
                  <span className="text-[12px] text-aco">{p.data}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </article>
      <SiteFooter />
    </>
  );
}
