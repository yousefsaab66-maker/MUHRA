"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeIn, SectionTitle } from "@/components/Section";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { formatDate } from "@/lib/format";

export default function JournalPage() {
  const { journal } = useStore();
  const { t, locale } = useLocale();
  const [hero, ...rest] = journal;
  return (
    <div>
      <section className="page-gutter py-20 md:py-28">
        <SectionTitle eyebrow={t("nav.journal")} title={t("journal.title")} subtitle={t("journal.subtitle")} />
      </section>

      {hero && (
        <section className="page-gutter">
          <FadeIn>
            <Link href={`/journal/${hero.slug}` as never} className="group block">
              <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-2 lg:gap-16">
                <div className="product-image-zoom relative aspect-[4/5] overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <Image src={hero.image} alt={hero.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <p className="eyebrow">{hero.category}</p>
                  <h2 className="font-display mt-5 text-4xl leading-[1.05] md:text-6xl gold-underline">{hero.title}</h2>
                  <p className="mt-6 text-base leading-relaxed opacity-85">{hero.excerpt}</p>
                  <p className="mt-6 text-[11px] tracking-eyebrow uppercase opacity-65">
                    {formatDate(hero.date, locale)} · {hero.author}
                  </p>
                </div>
              </div>
            </Link>
          </FadeIn>
        </section>
      )}

      <section className="page-gutter py-24 md:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((a, i) => (
            <FadeIn key={a.id} delay={i * 0.06}>
              <Link href={`/journal/${a.slug}` as never} className="group block">
                <div className="product-image-zoom relative aspect-[4/5] overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <Image src={a.image} alt={a.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </div>
                <p className="mt-5 eyebrow opacity-80">{a.category}</p>
                <h3 className="font-display mt-2 text-2xl gold-underline">{a.title}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-75">{a.excerpt}</p>
                <p className="mt-3 text-[10px] tracking-eyebrow uppercase opacity-60">{formatDate(a.date, locale)}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}
