"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";

export default function AdminLoginRedirect() {
  const router = useRouter();
  const { t } = useLocale();
  useEffect(() => {
    router.replace("/staff/login");
  }, [router]);
  return (
    <div className="px-6 py-32 text-center">
      <p className="font-display text-2xl">{t("admin.redirect.login")}</p>
    </div>
  );
}
