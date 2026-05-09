/**
 * Public restaurant menu page — Server Component (SSR + ISR)
 *
 * Rendering strategy:
 * - Server fetches restaurant + menu data with `force-cache` (revalidate: 3600)
 * - Full HTML (including menu items) is sent on the first byte → great TTFB & SEO
 * - generateMetadata() provides proper <title>, <meta description>, og:image
 * - Interactive parts (search, category chips, modal, analytics) live in MenuClient.tsx
 */

import type { Metadata } from "next";
import MenuClient, { type MenuData } from "./MenuClient";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ─── Data fetching ─────────────────────────────────────────────────────────────
async function getRestaurantData(slug: string): Promise<MenuData | null> {
  try {
    const res = await fetch(`${API}/public/r/${encodeURIComponent(slug)}`, {
      cache: "force-cache",
      next: { revalidate: 3600 }, // ISR: revalidate every hour
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MenuData & { error?: string };
    if (!data.ok) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantData(slug);

  if (!data?.restaurant) {
    return {
      title: "Restaurant Not Found | Spryon",
      description: "This restaurant page could not be found.",
    };
  }

  const r = data.restaurant;
  const title = r.page_title?.trim() || `${r.name} — Menu`;
  const description =
    r.page_description?.trim() ||
    `Browse the full menu at ${r.name}${r.city ? ` in ${r.city}` : ""}.`;

  // Resolve logo/og image URL (support both absolute and relative paths)
  const logoUrl = r.logo_url
    ? r.logo_url.startsWith("http")
      ? r.logo_url
      : `${API}${r.logo_url}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: logoUrl ? [{ url: logoUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: logoUrl ? [logoUrl] : undefined,
    },
    // Allow search engine indexing for active restaurants
    robots: { index: true, follow: true },
  };
}

// ─── Page component (Server Component) ────────────────────────────────────────
export default async function PublicRestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRestaurantData(slug);

  // ── Subscription expired ────────────────────────────────────────────────────
  if (data?.subscription_expired === true) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FEF2F2",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            width: "100%",
            maxWidth: "480px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "white",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 24px rgba(239,68,68,0.12)",
            }}
          >
            <span style={{ fontSize: "28px" }}>🍽️</span>
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#7F1D1D",
              marginBottom: "8px",
              letterSpacing: "-0.5px",
            }}
          >
            Menu Unavailable
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#991B1B",
              opacity: 0.85,
              lineHeight: 1.5,
              margin: "0 0 32px",
            }}
          >
            This restaurant&apos;s digital menu is temporarily unavailable.
            Please check back later or ask your server for a physical menu.
          </p>
          <div
            style={{
              fontSize: "12px",
              color: "#FCA5A5",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Powered by Spryon
          </div>
        </div>
      </div>
    );
  }

  // ── Restaurant not found ────────────────────────────────────────────────────
  if (!data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAFAFA",
          fontFamily: "'Inter', system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'); @keyframes floatUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
        <div
          style={{ textAlign: "center", maxWidth: "420px", animation: "floatUp 0.5s ease forwards" }}
        >
          <div
            style={{
              fontSize: "clamp(80px,20vw,120px)",
              fontWeight: 900,
              lineHeight: 1,
              color: "#F1F1F1",
              letterSpacing: "-6px",
              marginBottom: "8px",
              userSelect: "none",
            }}
          >
            404
          </div>
          <div
            style={{
              width: 72,
              height: 72,
              background: "white",
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              border: "1px solid #F0F0F0",
            }}
          >
            <span style={{ fontSize: 32 }}>🍽️</span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#111",
              marginBottom: 10,
              letterSpacing: "-0.5px",
            }}
          >
            Restaurant Not Found
          </h1>
          <p style={{ fontSize: "15px", color: "#888", lineHeight: 1.6, margin: "0 0 32px" }}>
            We couldn&apos;t find a restaurant at this link. It may have moved or
            the link may be incorrect.
          </p>
          <a
            href="https://spryon.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#111",
              color: "white",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 24px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go to Spryon
          </a>
          <p
            style={{
              marginTop: 28,
              fontSize: 11,
              color: "#CCC",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Powered by Spryon
          </p>
        </div>
      </div>
    );
  }

  // ── Happy path: render menu with pre-fetched data ──────────────────────────
  return <MenuClient data={data} slug={slug} />;
}
