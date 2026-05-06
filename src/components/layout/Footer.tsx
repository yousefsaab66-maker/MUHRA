"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { Wordmark } from "@/components/Wordmark";

export function Footer() {
  const { t, locale, setLocale } = useLocale();
  const { site } = useStore();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <footer className="mt-32 pb-[env(safe-area-inset-bottom,0px)]" style={{ borderTop: "1px solid var(--line)" }}>
      <section className="mx-auto max-w-[1400px] py-20 ps-[calc(1.5rem+env(safe-area-inset-left,0px))] pe-[calc(1.5rem+env(safe-area-inset-right,0px))] md:py-28 md:ps-[calc(3rem+env(safe-area-inset-left,0px))] md:pe-[calc(3rem+env(safe-area-inset-right,0px))]">
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div>
            <Wordmark size="md" align="left" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed opacity-75">
              {t("common.newsletter.copy")}
            </p>
            <form
              className="mt-7 flex max-w-sm items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubmitted(true);
              }}
            >
              <input
                type="email"
                required
                placeholder={t("common.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-luxe flex-1"
                disabled={submitted}
                aria-label={t("common.email")}
              />
              <button type="submit" className="btn-ghost" disabled={submitted}>
                {submitted ? "✓" : t("common.signup")}
              </button>
            </form>
          </div>

          <FooterColumn
            title={t("footer.services")}
            items={[
              [t("footer.bookAppointment"), "/boutiques"],
              [t("footer.contact"), "/boutiques"],
              [t("footer.repair"), "/story"],
              [t("footer.shipping"), "/story"],
            ]}
          />
          <FooterColumn
            title={t("footer.maison")}
            items={[
              [t("footer.story"), "/story"],
              [t("footer.craftsmanship"), "/story"],
              [t("footer.heritage"), "/collections/muhra-heritage"],
              [t("nav.journal"), "/journal"],
            ]}
          />
          <FooterColumn
            title={t("footer.legal")}
            items={[
              [t("footer.terms"), "/story"],
              [t("footer.privacy"), "/story"],
              [t("footer.cookies"), "/story"],
              [t("staff.signin"), "/staff/login"],
            ]}
          />
        </div>

        <div className="hairline mt-16" />

        <div className="mt-10 grid gap-8 text-[11px] tracking-eyebrow uppercase opacity-80 md:grid-cols-3">
          <p>© {new Date().getFullYear()} {site.brandName} — {t("common.allRights")}</p>
          <div className="flex items-center gap-3 md:justify-center">
            <span className="opacity-70">{t("country.title")}</span>
            <span>· EUR · €</span>
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            <span className="opacity-70 me-2">{t("lang.title")}:</span>
            {(["en", "fr", "it", "es", "ar"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2 ${
                  locale === l ? "opacity-100" : "opacity-50 hover:opacity-100"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div>
      <h4 className="eyebrow mb-5">{title}</h4>
      <ul className="space-y-3 text-sm">
        {items.map(([label, href]) => (
          <li key={label + href}>
            <Link
              href={href as never}
              className="gold-underline opacity-90 hover:opacity-100"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
