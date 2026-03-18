import PublicMenu from "@/components/PublicMenu";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export default async function MenuTokenPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    return <PublicMenu qrToken={token} />;
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    try {
        const res = await fetch(`${API}/public/menu/${token}`, { next: { revalidate: 60 } });
        if (res.ok) {
            const data = await res.json() as {
                ok: boolean;
                restaurant: { name: string; logo_url: string | null; page_title?: string | null };
            };
            if (data.ok && data.restaurant) {
                const r = data.restaurant;
                const title = r.page_title || `${r.name} — Menu`;
                const favicon = r.logo_url ? `${API}${r.logo_url}` : undefined;
                return {
                    title,
                    description: `Browse the menu at ${r.name}`,
                    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
                };
            }
        }
    } catch { /* fall through */ }
    return {
        title: "Menu",
        description: "View our digital menu",
    };
}
