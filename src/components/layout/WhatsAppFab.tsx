"use client";

import { MessageCircle } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

/** العراق 078… → صيغة واتساب الدولية بدون + */
const WHATSAPP_WA_ME = "9647800839820";

export function WhatsAppFab() {
  const { t } = useLocale();
  const text = encodeURIComponent(t("common.whatsappPrefill"));
  const href = `https://wa.me/${WHATSAPP_WA_ME}?text=${text}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed end-6 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-[filter,transform] hover:brightness-105 active:scale-[0.98] sm:px-5"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
      }}
      aria-label={t("common.whatsappAria")}
    >
      <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.6} aria-hidden />
      <span className="truncate text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs">
        {t("common.whatsapp")}
      </span>
    </a>
  );
}
