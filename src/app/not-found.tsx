"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display mt-5 text-4xl md:text-5xl">{t("notFound.title")}</h1>
        <p className="mt-6 leading-relaxed opacity-80">{t("notFound.body")}</p>
        <Link href={"/" as never} className="btn-primary mt-10 inline-flex">
          {t("notFound.cta")}
        </Link>
      </div>
    </div>
  );
}
