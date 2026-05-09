import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Spryon — Restaurant Digital Menu",
    description: "Spryon admin dashboard for managing your restaurant digital menu.",
  };
  try {
    const res = await fetch(`${API}/api/public/settings`, {
      cache: 'force-cache',
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.settings) {
        const s = json.settings;
        return {
          title: s.global_title || fallback.title,
          description: s.global_description || fallback.description,
          icons: { icon: s.global_favicon_url || "/favicon-rounded.png" },
          openGraph: (s.global_og_image_url || s.global_logo_url) ? { images: [s.global_og_image_url || s.global_logo_url] } : undefined,
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { ...fallback, icons: { icon: "/favicon-rounded.png" } };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
