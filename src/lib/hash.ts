const SALT = "MUHRA-2026-LUMIERE";

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const subtle = (globalThis.crypto?.subtle ??
    (globalThis.crypto as unknown as { webkitSubtle?: SubtleCrypto })?.webkitSubtle) as
    | SubtleCrypto
    | undefined;
  if (!subtle) {
    let h = 0;
    for (const ch of input) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
    return `fb-${(h >>> 0).toString(16)}`;
  }
  const buf = await subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function withSalt(username: string, password: string) {
  return `${SALT}::${username.toLowerCase().trim()}::${password}`;
}

export async function hashCredential(username: string, password: string) {
  return sha256(withSalt(username, password));
}
