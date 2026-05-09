import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://192.168.43.66:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },

  // ─── HTTP Response Headers ───────────────────────────────────────────────────
  // These apply when running on Cloudflare Pages (or any Next.js host).
  // The public/_headers file provides the same rules at the Cloudflare edge level.
  async headers() {
    return [
      // Immutable hashed static assets — browsers cache forever
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Next.js image optimisation output
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Public SSR pages — edge cache 1 h, SWR 24 h
      {
        source: "/((?!api|admin|dashboard|login|register|settings|subscription|analytics).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Authenticated / private routes — never cache
      {
        source: "/(admin|dashboard|settings|subscription|analytics|login|register)/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
      // API routes — never cache
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;