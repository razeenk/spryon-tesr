import type { Metadata } from 'next';

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    try {
        const res = await fetch(`${API}/public/r/${slug}`, { next: { revalidate: 60 } });
        if (res.ok) {
            const data = await res.json() as {
                ok: boolean;
                restaurant: { name: string; logo_url: string | null; page_title?: string | null; page_description?: string | null; og_image_url?: string | null; };
            };
            if (data.ok && data.restaurant) {
                const r = data.restaurant;
                const title = r.page_title || `${r.name} — Menu`;
                const description = r.page_description || `Browse the full menu at ${r.name}`;
                const favicon = r.logo_url ? (r.logo_url.startsWith('http') ? r.logo_url : `${API}${r.logo_url}`) : undefined;
                const ogImage = r.og_image_url ? (r.og_image_url.startsWith('http') ? r.og_image_url : `${API}${r.og_image_url}`) : favicon;
                
                return {
                    title,
                    description,
                    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
                    openGraph: {
                        title,
                        description,
                        images: ogImage ? [{ url: ogImage }] : undefined,
                    },
                    twitter: {
                        card: 'summary_large_image',
                        title,
                        description,
                        images: ogImage ? [ogImage] : undefined,
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
