"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DICTS, RTL_LOCALES, type Locale } from "@/lib/i18n";

type LocaleCtx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<LocaleCtx | null>(null);
const STORAGE_KEY = "muhra-locale-v1";

function applyLocaleToDocument(locale: Locale) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute(
    "dir",
    RTL_LOCALES.includes(locale) ? "rtl" : "ltr",
  );
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in DICTS) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocaleState(stored as Locale);
        applyLocaleToDocument(stored as Locale);
      } else {
        applyLocaleToDocument("en");
      }
    } catch {
      applyLocaleToDocument("en");
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    applyLocaleToDocument(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const translate = useCallback(
    (key: string) => DICTS[locale]?.[key] ?? DICTS.en[key] ?? key,
    [locale],
  );

  const value = useMemo<LocaleCtx>(
    () => ({
      locale,
      setLocale,
      t: translate,
      dir: RTL_LOCALES.includes(locale) ? "rtl" : "ltr",
    }),
    [locale, setLocale, translate],
  );

  return (
    <LocaleContext.Provider value={value}>
      <span data-hydrated={hydrated} className="contents">
        {children}
      </span>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
