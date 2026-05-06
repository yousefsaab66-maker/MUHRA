"use client";

import Link from "next/link";
import { useStore } from "./providers/StoreProvider";

interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  align?: "left" | "center";
}

export function Wordmark({ size = "md", href = "/", align = "center" }: WordmarkProps) {
  const { site } = useStore();
  const [main, sub] = (site.brandName || "MUHRA JEWELRY").split(" ");
  const mainLabel = main || "MUHRA";
  const subLabel = sub || "JEWELRY";

  const sizes = {
    sm: { main: "text-lg", sub: "text-[8px]" },
    md: { main: "text-2xl md:text-[1.7rem]", sub: "text-[10px]" },
    lg: { main: "text-4xl md:text-5xl", sub: "text-[12px]" },
  } as const;

  return (
    <Link
      href={href as never}
      aria-label={site.brandName}
      className={`inline-flex flex-col leading-none ${
        align === "center" ? "items-center" : "items-start"
      } gap-[3px] select-none`}
    >
      <span
        className={`font-display ${sizes[size].main} tracking-luxe uppercase`}
        style={{ fontWeight: 500 }}
      >
        {mainLabel}
      </span>
      <span className={`${sizes[size].sub} tracking-eyebrow uppercase opacity-70`}>
        {subLabel}
      </span>
    </Link>
  );
}
