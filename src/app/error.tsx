"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="px-6 py-32 md:py-40">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow" style={{ color: "var(--color-bordeaux)" }}>!</p>
        <h1 className="font-display mt-5 text-4xl md:text-5xl">{t("error.title")}</h1>
        <p className="mt-6 leading-relaxed opacity-80">{t("error.body")}</p>
        <button type="button" onClick={() => reset()} className="btn-primary mt-10 inline-flex">
          {t("error.cta")}
        </button>
      </div>
    </div>
  );
}
