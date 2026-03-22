import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    try {
        const res = await fetch(`${API}/public/r/${slug}`, { next: { revalidate: 60 } });
        if (res.ok) {
            const data = await res.json() as {
                ok: boolean;
                restaurant: { name: string; logo_url: string | null; page_title?: string | null; page_description?: string | null };
            };
            if (data.ok && data.restaurant) {
                const r = data.restaurant;
                const title = r.page_title || `${r.name} — Menu`;
                const description = r.page_description || `Browse the full menu at ${r.name}`;
                const favicon = r.logo_url ? (r.logo_url.startsWith('http') ? r.logo_url : `${API}${r.logo_url}`) : undefined;
                
                return {
                    title,
                    description,
                    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
                    openGraph: {
                        title,
                        description,
                        images: favicon ? [{ url: favicon }] : undefined,
                    },
                    twitter: {
                        card: 'summary',
                        title,
                        description,
                        images: favicon ? [favicon] : undefined,
                    }
                };
            }
        }
    } catch { /* ignore */ }
    
    return {
        title: "Spryon Menu",
        description: "View our digital menu",
    };
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
