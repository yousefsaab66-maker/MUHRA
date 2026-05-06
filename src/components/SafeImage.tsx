"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Drop-in wrapper around `next/image` that automatically opts out of the Next.js
 * image optimizer for `data:` URLs (uploaded by staff from their computer).
 *
 * The optimizer will reject `data:` and remote hostnames not declared in
 * `next.config`, so any image whose source is a data URL must be passed through
 * with `unoptimized`.
 */
export function SafeImage({ src, alt, unoptimized, ...rest }: ImageProps) {
  const isData = typeof src === "string" && src.startsWith("data:");
  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={unoptimized || isData}
      {...rest}
    />
  );
}
