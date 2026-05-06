"use client";

import Image from "next/image";
import Link from "next/link";
import { FadeIn, SectionTitle } from "@/components/Section";
import { useStore } from "@/components/providers/StoreProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function CollectionsIndex() {
  const { collections } = useStore();
  const { t } = useLocale();
  return (
    <div className="page-gutter py-20 md:py-28">
      <SectionTitle
        eyebrow={t("nav.collections")}
        title={t("collections.heading")}
        subtitle={t("collections.subtitle")}
      />
      <div className="mx-auto mt-16 grid max-w-[1400px] gap-12 md:grid-cols-2">
        {collections.map((c, i) => (
          <FadeIn key={c.id} delay={i * 0.07}>
            <Link
              href={`/collections/${c.slug}` as never}
              className="group block"
            >
              <div className="product-image-zoom relative aspect-[4/5] overflow-hidden" style={{ background: "var(--surface-2)" }}>
                <Image
                  src={c.coverImage}
                  alt={c.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.55))" }} />
                <div className="absolute inset-x-0 bottom-0 p-8 text-[var(--color-ivory)]">
                  <p className="eyebrow" style={{ color: "var(--color-gold)" }}>
                    {t("nav.collections")}
                  </p>
                  <h3 className="font-display mt-3 text-4xl md:text-5xl" style={{ color: "var(--color-ivory)" }}>
                    {c.name}
                  </h3>
                  <p className="mt-2 italic opacity-90">{c.tagline}</p>
                </div>
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
