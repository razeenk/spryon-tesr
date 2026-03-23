import type { Metadata } from "next";
import "./globals.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8787";

export async function generateMetadata(): Promise<Metadata> {
  const fallback = {
    title: "Spryon — Restaurant Digital Menu",
    description: "Spryon admin dashboard for managing your restaurant digital menu.",
  };
  try {
    const res = await fetch(`${API}/api/public/settings`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.ok && json.settings) {
        const s = json.settings;
        return {
          title: s.global_title || fallback.title,
          description: s.global_description || fallback.description,
          icons: { icon: s.global_favicon_url || "/globe.svg" },
          openGraph: (s.global_og_image_url || s.global_logo_url) ? { images: [s.global_og_image_url || s.global_logo_url] } : undefined,
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
