"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/components/providers/StoreProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatDate } from "@/lib/format";

export default function JournalArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { journal } = useStore();
  const { t, locale } = useLocale();
  const article = useMemo(() => journal.find((a) => a.slug === slug), [journal, slug]);
  if (!article) {
    return (
      <div className="px-6 py-32 text-center">
        <p className="font-display text-3xl">{t("journal.notFound")}</p>
        <Link href={"/journal" as never} className="btn-ghost mt-8">
          {t("common.viewAll")} →
        </Link>
      </div>
    );
  }
  return (
    <article>
      <section className="relative h-[70svh] min-h-[480px] overflow-hidden" style={{ background: "var(--color-onyx)" }}>
        <Image src={article.image} alt={article.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center" style={{ color: "var(--color-ivory)" }}>
          <p className="eyebrow" style={{ color: "var(--color-gold)" }}>{article.category}</p>
          <h1 className="font-display mt-5 max-w-4xl text-4xl md:text-6xl">{article.title}</h1>
          <p className="mt-5 max-w-xl italic opacity-90">{article.excerpt}</p>
          <p className="mt-5 text-[11px] tracking-eyebrow uppercase opacity-80">
            {formatDate(article.date, locale)} · {article.author}
          </p>
        </div>
      </section>

      <section className="page-gutter py-20 md:py-28">
        <div className="mx-auto max-w-2xl">
          {article.body.split(/\n\n+/).map((p, i) => (
            <p key={i} className={`mb-7 leading-relaxed ${i === 0 ? "font-display text-2xl md:text-3xl" : "text-base opacity-85"}`}>
              {p}
            </p>
          ))}
          <div className="hairline mt-12" />
          <Link href={"/journal" as never} className="btn-ghost mt-12">
            ← {t("common.viewAll")}
          </Link>
        </div>
      </section>
    </article>
  );
}
