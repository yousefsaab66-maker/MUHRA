"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { FadeIn } from "@/components/Section";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/components/providers/StoreProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function CollectionPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { collections, products } = useStore();
  const { t } = useLocale();
  const collection = useMemo(() => collections.find((c) => c.slug === slug), [collections, slug]);
  const items = useMemo(
    () => (collection ? products.filter((p) => p.collection === collection.slug) : []),
    [products, collection],
  );

  if (!collection) {
    if (typeof window !== "undefined") notFound();
    return null;
  }

  return (
    <div className="flex flex-col">
      <section className="relative h-[60svh] min-h-[460px] overflow-hidden" style={{ background: "var(--color-onyx)" }}>
        <Image
          src={collection.coverImage}
          alt={collection.name}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.55))" }} />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center" style={{ color: "var(--color-ivory)" }}>
          <p className="eyebrow" style={{ color: "var(--color-gold)" }}>{t("nav.collections")}</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.05] md:text-7xl">{collection.name}</h1>
          <p className="mt-4 italic opacity-90 md:text-lg">{collection.tagline}</p>
        </div>
      </section>

      <section className="page-gutter py-20 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <FadeIn>
            <div className="relative aspect-[3/4]" style={{ background: "var(--surface-2)" }}>
              <Image
                src={collection.editorialImage}
                alt={collection.name}
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div>
              <p className="eyebrow">{t("collection.editorial.eyebrow")}</p>
              <h2 className="font-display mt-5 text-3xl leading-tight md:text-5xl">{t("collection.editorial.title")}</h2>
              <p className="mt-7 text-base leading-relaxed opacity-85">{collection.description}</p>
              <p className="mt-5 text-base leading-relaxed opacity-75">
                {t("collection.editorial.bodyCount").replace("{n}", String(items.length))}
              </p>
              <Link href={"/products" as never} className="btn-ghost mt-10">
                {t("common.viewAll")} →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="page-gutter py-20 md:py-28" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-[1400px]">
          <h3 className="font-display text-3xl md:text-4xl">{t("collection.creations")}</h3>
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
            {items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
