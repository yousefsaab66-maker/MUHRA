import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* Monorepo / stray lockfile: pin tracing to this app so `next dev` picks the right root */
  outputFileTracingRoot: path.join(process.cwd()),
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
