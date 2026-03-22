"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; }
interface MenuItem {
    id: string; name: string; description: string | null; price: number;
    available: number; scan_count?: number; image_url: string | null;
    category_id: string | null; category_name: string | null;
    is_veg?: number; allergens?: string[];
}
interface SocialLinks {
    instagram?: string; whatsapp?: string; facebook?: string; website?: string;
    instagram_enabled?: boolean; whatsapp_enabled?: boolean;
    facebook_enabled?: boolean; website_enabled?: boolean;
}
interface Theme { accent: string; background: string; text: string; cardColor?: string; headingColor?: string; descColor?: string; }
interface Restaurant {
    id: string; name: string; city: string | null;
    slug: string | null; page_title: string | null; page_description: string | null;
    logo_url: string | null; social_links: SocialLinks | null; theme: Theme | null;
    is_open?: number; location_url?: string | null; currency?: string | null;
}
interface MenuData { ok: boolean; restaurant: Restaurant; items: MenuItem[]; categories: Category[]; platformUrl?: string; }

const ALLERGENS: Record<string, string> = { gluten: "🌾", dairy: "🥛", nuts: "🥜", eggs: "🥚", soy: "🫘", seafood: "🦐", sesame: "🌿" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", INR: "₹", AED: "د.إ", SGD: "S$", AUD: "A$", JPY: "¥"
};
function getCurrencySymbol(code?: string | null) { return CURRENCY_SYMBOLS[code ?? "USD"] ?? code ?? "$"; }
const fmtPrice = (p: number, sym: string) => `${sym}${p.toFixed(2)}`;

function buildUtmUrl(url: string, slug: string) {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        u.searchParams.set("utm_source", "spryon");
        u.searchParams.set("utm_medium", "bio_menu");
        u.searchParams.set("utm_campaign", slug);
        return u.toString();
    } catch { return url; }
}

function getSessionId(slug: string): string {
    const key = `spryon_pid_${slug}`;
    const EXPIRY = 2 * 60 * 60 * 1000;
    try {
        const raw = localStorage.getItem(key);
        const stored = raw ? JSON.parse(raw) as { id: string; ts: number } : null;
        if (stored && Date.now() - stored.ts < EXPIRY) return stored.id;
    } catch { /* ignore */ }
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    try { localStorage.setItem(key, JSON.stringify({ id, ts: Date.now() })); } catch { /* ignore */ }
    return id;
}

function track(event: string, slug: string, extra?: Record<string, unknown>) {
    fetch(`${API}/public/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event, restaurant_slug: slug,
            session_id: getSessionId(slug),
            referrer: typeof document !== "undefined" ? document.referrer : "",
            device_type: typeof navigator !== "undefined" && /Mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
            timestamp: Date.now(), ...extra,
        }),
        keepalive: true,
    }).catch(() => { /* ignore */ });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 4 }: { w?: string | number; h?: number; r?: number }) {
    return <div style={{ width: w, height: h, borderRadius: r, background: "#EBEBEB", animation: "skel 1.4s ease infinite" }} />;
}

// ─── Lazy image ───────────────────────────────────────────────────────────────
function LazyImg({ src, alt, size }: { src: string; alt: string; size: number }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div style={{ width: size, height: size, borderRadius: "14px", overflow: "hidden", background: "#F3F3F3", flexShrink: 0, position: "relative" }}>
            {!loaded && <div style={{ position: "absolute", inset: 0, background: "#EBEBEB", animation: "skel 1.4s ease infinite" }} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: loaded ? 1 : 0, transition: "opacity 0.2s" }} />
        </div>
    );
}

// ─── Social icons ─────────────────────────────────────────────────────────────
const SOCIAL: Record<string, React.ReactNode> = {
    instagram: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
    whatsapp: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
    facebook: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
    website: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
};

// ─── Share button (replaces table number) ────────────────────────────────────
function ShareButton({ accent, slug, platformUrl }: { accent: string; slug: string; platformUrl?: string }) {
    const [copied, setCopied] = useState(false);
    const origin = platformUrl || (typeof window !== "undefined" ? window.location.origin : "https://spryon.app");
    const url = `${origin}/${slug}`;

    const handleShare = async () => {
        track("share_click", slug);
        if (navigator.share) {
            try { await navigator.share({ title: document.title, url }); } catch { /* dismissed */ }
        } else {
            try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
        }
    };

    return (
        <button onClick={handleShare}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${accent}30`, background: `${accent}12`, color: accent, fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${accent}22`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${accent}12`)}>
            {copied ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied!</>
            ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>Share</>
            )}
        </button>
    );
}

// ─── Item detail modal (bottom sheet) ────────────────────────────────────────
function ItemModal({ item, accent, restaurantName, currencySymbol, onClose }: { item: MenuItem; accent: string; restaurantName: string; currencySymbol: string; onClose: () => void }) {
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onTouch = (e: TouchEvent) => { if ((e.target as HTMLElement).closest(".modal-sheet")) return; e.preventDefault(); };
        document.addEventListener("touchmove", onTouch, { passive: false });
        return () => { document.body.style.overflow = prev; document.removeEventListener("touchmove", onTouch); };
    }, []);

    const marqueeText = `${restaurantName} ✦ `;
    const repeated = marqueeText.repeat(8);

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "fadein 0.15s ease" }}>
            <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "720px", overflow: "hidden", animation: "slideup 0.2s ease" }}>
                {/* Marquee banner */}
                <div style={{ background: accent, overflow: "hidden", padding: "9px 0" }}>
                    <div style={{ display: "flex", whiteSpace: "nowrap", animation: "marquee 14s linear infinite", willChange: "transform" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "white", letterSpacing: "0.06em", opacity: 0.92 }}>{repeated}</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "white", letterSpacing: "0.06em", opacity: 0.92 }}>{repeated}</span>
                    </div>
                </div>
                {item.image_url && (
                    <div style={{ height: "210px", background: "#F3F3F3", overflow: "hidden" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url.startsWith("http") ? item.image_url : `${API}${item.image_url}`} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: item.available ? 1 : 0.5 }} />
                    </div>
                )}
                <div style={{ padding: "22px 22px 36px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 600, color: item.available ? "#111" : "#999", lineHeight: 1.3, margin: 0, display: "flex", alignItems: "center", gap: "7px" }}>
                            {item.is_veg === 1 && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                    <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#22C55E" strokeWidth="1.2" fill="white" />
                                    <circle cx="7" cy="7" r="4" fill="#22C55E" />
                                </svg>
                            )}
                            {item.is_veg === 2 && (
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                    <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#B45309" strokeWidth="1.2" fill="white" />
                                    <circle cx="7" cy="7" r="4" fill="#DC2626" />
                                </svg>
                            )}
                            {item.name}
                        </h2>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: item.available ? accent : "#BBB", flexShrink: 0 }}>{fmtPrice(item.price, currencySymbol)}</span>
                    </div>
                    {item.category_name && (
                        <p style={{ margin: "0 0 10px", fontSize: "11px", fontWeight: 600, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em" }}>{item.category_name}</p>
                    )}
                    {item.description && (
                        <p style={{ margin: 0, fontSize: "14px", color: "#666", lineHeight: 1.65 }}>{item.description}</p>
                    )}
                    {item.allergens && item.allergens.length > 0 && (
                        <div style={{ marginTop: "14px", padding: "12px 14px", background: "#FAFAFA", borderRadius: "10px", border: "1px solid #EFEFEF" }}>
                            <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>Contains allergens</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {item.allergens.map((a) => ALLERGENS[a] ? (
                                    <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", background: "white", border: "1px solid #E8E8E8", borderRadius: "8px", fontSize: "12.5px", fontWeight: 500, color: "#555" }}>
                                        {ALLERGENS[a]} {a.charAt(0).toUpperCase() + a.slice(1)}
                                    </span>
                                ) : null)}
                            </div>
                        </div>
                    )}
                    {!item.available && (
                        <p style={{ margin: "14px 0 0", fontSize: "13px", color: "#999", background: "#F5F5F5", borderRadius: "8px", padding: "9px 12px" }}>Currently unavailable.</p>
                    )}
                    <button onClick={onClose} style={{ marginTop: "22px", width: "100%", padding: "12px", background: "white", border: "1px solid #E0E0E0", borderRadius: "12px", fontSize: "14px", fontWeight: 500, color: "#444", cursor: "pointer", fontFamily: "inherit" }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicRestaurantPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);

    const [data, setData] = useState<MenuData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCat, setActiveCat] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [scrolled50, setScrolled50] = useState(false);

    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const scrollLock = useRef(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const trackedItems = useRef<Set<string>>(new Set());

    // Load data
    useEffect(() => {
        if (!slug) return;
        (async () => {
            try {
                const res = await fetch(`${API}/public/r/${slug}`);
                if (!res.ok) { setError("Restaurant not found"); return; }
                const json = await res.json() as MenuData & { error?: string };
                if (!res.ok || !json.ok) { setError(json.error ?? "Menu not found"); return; }
                setData(json);
                track("menu_visit", slug, {
                    utm_source: new URLSearchParams(window.location.search).get("utm_source") ?? "",
                });
            } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to load menu");
            } finally { setLoading(false); }
        })();
    }, [slug]);

    // Browser title + meta description
    useEffect(() => {
        if (!data?.restaurant) return;
        const r = data.restaurant;
        document.title = r.page_title?.trim() || `Our Menu | ${r.name}`;
        let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
        if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
        meta.content = r.page_description?.trim() || `Browse the full menu at ${r.name}`;
        return () => { document.title = "Spryon"; };
    }, [data]);

    // Intersection observer for category highlighting
    useEffect(() => {
        if (!data) return;
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (scrollLock.current) return;
                const vis = entries.filter((e) => e.isIntersecting);
                if (!vis.length) return;
                const id = vis[0].target.getAttribute("data-cid") ?? "all";
                setActiveCat(id);
                // Scroll the chip into view horizontally only — never trigger a vertical scroll
                const chip = chipRefs.current[id];
                if (chip) {
                    const nav = chip.parentElement;
                    if (nav) {
                        const chipLeft = chip.offsetLeft;
                        const chipWidth = chip.offsetWidth;
                        const navWidth = nav.offsetWidth;
                        nav.scrollTo({ left: chipLeft - navWidth / 2 + chipWidth / 2, behavior: "smooth" });
                    }
                }
            },
            { rootMargin: "-24% 0px -65% 0px", threshold: 0 }
        );
        Object.values(sectionRefs.current).forEach((el) => el && observerRef.current!.observe(el));
        return () => observerRef.current?.disconnect();
    }, [data]);

    // 50% scroll depth
    useEffect(() => {
        if (scrolled50 || !data) return;
        const onScroll = () => {
            const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            if (pct >= 0.5) { setScrolled50(true); track("engagement", slug, { depth: 50 }); }
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [data, scrolled50, slug]);

    const scrollTo = (catId: string) => {
        setActiveCat(catId);
        scrollLock.current = true;
        const el = catId === "all" ? document.getElementById("menu-anchor") : sectionRefs.current[catId];
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => { scrollLock.current = false; }, 900);
    };

    const onItemView = useCallback((itemId: string) => {
        if (trackedItems.current.has(itemId)) return;
        trackedItems.current.add(itemId);
        track("item_view", slug, { item_id: itemId });
    }, [slug]);

    const openItem = (item: MenuItem) => { onItemView(item.id); setSelectedItem(item); };

    const onSocialClick = useCallback((platform: string) => {
        track("social_click", slug, { platform });
    }, [slug]);

    const accent = data?.restaurant.theme?.accent ?? "#111111";
    const bg = data?.restaurant.theme?.background ?? "#FAFAFA";
    const cardColor = data?.restaurant.theme?.cardColor ?? "#FFFFFF";
    const headingColor = data?.restaurant.theme?.headingColor ?? "#111111";
    const descColor = data?.restaurant.theme?.descColor ?? "#888888";
    const categories = data?.categories ?? [];
    const allItems = data?.items ?? [];
    const sl = data?.restaurant.social_links;
    const socials = sl
        ? (["instagram", "whatsapp", "facebook", "website"] as const).filter(
            (k) => sl[k] && sl[`${k}_enabled` as keyof typeof sl] !== false
        )
        : [];

    // Group items
    const grouped: { cat: Category | null; catId: string; items: MenuItem[] }[] = [];
    if (search) {
        const q = search.toLowerCase();
        const hit = allItems.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
        if (hit.length) grouped.push({ cat: null, catId: "search", items: hit });
    } else {
        categories.forEach((cat) => {
            const its = allItems.filter((i) => i.category_id === cat.id);
            if (its.length) grouped.push({ cat, catId: cat.id, items: its });
        });
        const uncat = allItems.filter((i) => !i.category_id);
        if (uncat.length) grouped.push({ cat: null, catId: "other", items: uncat });
    }

    if (error) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAFA", fontFamily: "'Inter', system-ui, sans-serif" }}>
            <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <p style={{ fontSize: "11px", color: "#999", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "8px" }}>Menu unavailable</p>
                <p style={{ fontSize: "15px", color: "#666" }}>{error}</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", WebkitFontSmoothing: "antialiased", paddingBottom: "80px" }}>

            {/* ══ HEADER ══ */}
            <header style={{
                position: "sticky", top: 0, zIndex: 100,
                background: `color-mix(in srgb, ${bg} 90%, transparent)`,
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}>
                <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 20px 0" }}>
                    {/* Brand row */}
                    {loading ? (
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
                            <Skel w={44} h={44} r={10} />
                            <div style={{ flex: 1 }}>
                                <Skel w="140px" h={15} /><div style={{ marginTop: 5 }}><Skel w="80px" h={11} /></div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            {/* Left: logo + name */}
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                                {data?.restaurant.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={data.restaurant.logo_url.startsWith("http") ? data.restaurant.logo_url : `${API}${data.restaurant.logo_url}`}
                                        alt={data.restaurant.name}
                                        style={{ width: "72px", height: "72px", borderRadius: "14px", objectFit: "cover", border: "1px solid #E8E8E8", flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: "72px", height: "72px", background: accent, borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ color: "white", fontSize: "28px", fontWeight: 700 }}>{(data?.restaurant.name ?? "R").charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                                <div style={{ minWidth: 0, overflow: "hidden" }}>
                                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#111", lineHeight: 1.15, letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {data?.restaurant.name}
                                    </div>
                                </div>
                            </div>
                            {/* Right: share button (replaces table number) */}
                            <ShareButton accent={accent} slug={slug} platformUrl={data?.platformUrl} />
                        </div>
                    )}

                    {/* Search */}
                    <div style={{ position: "relative", marginBottom: "12px" }}>
                        <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#C8C8C8", pointerEvents: "none" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <input placeholder="Search menu…" value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px 9px 32px", border: "1px solid #E8E8E8", borderRadius: "9px", fontSize: "13.5px", color: "#222", background: "white", outline: "none", fontFamily: "inherit" }} />
                    </div>
                </div>

                {/* Category chips */}
                {!search && (loading || categories.length > 0) && (
                    <div style={{ maxWidth: "720px", margin: "0 auto", overflowX: "auto", scrollbarWidth: "none" }}>
                        <div style={{ display: "flex", gap: "8px", padding: "0 20px 12px", minWidth: "max-content" }}>
                            {loading ? Array(5).fill(0).map((_, i) => <Skel key={i} w={72} h={34} r={10} />) :
                                [{ id: "all", name: "All Items" }, ...categories].map((cat) => {
                                    const active = activeCat === cat.id;
                                    return (
                                        <button key={cat.id} ref={(el) => { chipRefs.current[cat.id] = el; }} onClick={() => scrollTo(cat.id)}
                                            style={{ padding: "7px 16px", borderRadius: "10px", fontFamily: "inherit", whiteSpace: "nowrap", fontSize: "13px", fontWeight: active ? 600 : 400, cursor: "pointer", border: `1px solid ${active ? accent : "#E0E0E0"}`, background: active ? accent : "white", color: active ? "white" : "#555", transition: "all 0.12s", boxShadow: active ? `0 1px 6px ${accent}40` : "none" }}>
                                            {cat.name}
                                        </button>
                                    );
                                })
                            }
                        </div>
                    </div>
                )}
            </header>

            {/* ══ CLOSED BANNER ══ */}
            {!loading && data?.restaurant.is_open === 0 && (
                <div style={{ background: accent, color: "white", textAlign: "center", padding: "14px 20px", fontSize: "13.5px", fontWeight: 600, letterSpacing: "0.04em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    We&apos;re currently closed — check back soon!
                </div>
            )}


            {/* ══ MAIN ══ */}
            <main style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px 40px" }}>
                <div id="menu-anchor" />

                {/* Skeletons */}
                {loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                        {[3, 4].map((n, gi) => (
                            <div key={gi}>
                                <Skel w="100px" h={11} r={3} />
                                <div style={{ height: "1px", background: "#EBEBEB", margin: "10px 0 14px" }} />
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {Array(n).fill(0).map((_, i) => (
                                        <div key={i} style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "16px", padding: "14px", display: "flex", gap: "14px", alignItems: "center" }}>
                                            <Skel w={96} h={96} r={14} />
                                            <div style={{ flex: 1 }}>
                                                <Skel w="55%" h={15} />
                                                <div style={{ marginTop: 7 }}><Skel h={12} /></div>
                                                <div style={{ marginTop: 4 }}><Skel w="70%" h={12} /></div>
                                                <div style={{ marginTop: 14 }}><Skel w={52} h={16} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty search */}
                {!loading && search && grouped.length === 0 && (
                    <div style={{ textAlign: "center", padding: "72px 20px" }}>
                        <p style={{ fontSize: "11px", color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>No results</p>
                        <p style={{ fontSize: "14px", color: "#888" }}>Try a different search.</p>
                    </div>
                )}

                {/* Sections */}
                {!loading && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
                        {grouped.map(({ cat, catId, items }) => (
                            <section key={catId} ref={(el) => { sectionRefs.current[catId] = el; }} data-cid={catId}>
                                {cat && (
                                    <div style={{ marginBottom: "14px" }}>
                                        <h2 style={{ fontSize: "10.5px", fontWeight: 700, color: "#AAA", textTransform: "uppercase", letterSpacing: "0.10em", margin: 0 }}>
                                            {cat.name}
                                        </h2>
                                        <div style={{ height: "1px", background: "#EBEBEB", marginTop: "9px" }} />
                                    </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {items.map((item) => {
                                        const soldOut = item.available === 0;
                                        return (
                                            <div key={item.id}
                                                onClick={() => openItem(item)}
                                                style={{ background: cardColor, border: "1px solid rgba(0,0,0,0.07)", borderRadius: "16px", padding: "14px", display: "flex", gap: "14px", alignItems: "center", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.12s", userSelect: "none" }}
                                                onMouseEnter={(e) => { if (!soldOut) (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.15)"; }}
                                                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.07)"; }}
                                                onTouchStart={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "0.85"; }}
                                                onTouchEnd={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}>

                                                {soldOut && (
                                                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.6)", zIndex: 2, borderRadius: "16px" }} />
                                                )}

                                                {/* Image */}
                                                {item.image_url ? (
                                                    <div style={{ position: "relative", flexShrink: 0 }}>
                                                        <LazyImg src={item.image_url.startsWith("http") ? item.image_url : `${API}${item.image_url}`} alt={item.name} size={116} />
                                                        {soldOut && <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)", borderRadius: "14px" }} />}
                                                    </div>
                                                ) : (
                                                    <div style={{ width: 116, height: 116, borderRadius: "14px", background: "#F3F3F3", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" /></svg>
                                                    </div>
                                                )}

                                                {/* Text */}
                                                <div style={{ flex: 1, minWidth: 0, opacity: soldOut ? 0.5 : 1 }}>
                                                    <p style={{ fontSize: "15px", fontWeight: 500, color: soldOut ? "#AAA" : headingColor, margin: "0 0 4px", letterSpacing: "-0.1px", lineHeight: 1.3, display: "flex", alignItems: "center", gap: "6px" }}>
                                                        {item.is_veg === 1 && (
                                                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#22C55E" strokeWidth="1.2" fill="white" />
                                                                <circle cx="7" cy="7" r="4" fill="#22C55E" />
                                                            </svg>
                                                        )}
                                                        {item.is_veg === 2 && (
                                                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                                                <rect x="0.5" y="0.5" width="13" height="13" rx="1.5" stroke="#B45309" strokeWidth="1.2" fill="white" />
                                                                <circle cx="7" cy="7" r="4" fill="#DC2626" />
                                                            </svg>
                                                        )}
                                                        {item.name}
                                                    </p>
                                                    {item.description && (
                                                        <p style={{ fontSize: "12.5px", color: soldOut ? "#CCC" : descColor, margin: "0 0 6px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ fontSize: "15px", fontWeight: 700, color: soldOut ? "#BBB" : accent, letterSpacing: "-0.2px" }}>
                                                            {fmtPrice(item.price, getCurrencySymbol(data?.restaurant.currency))}
                                                        </span>
                                                        {soldOut && (
                                                            <span style={{ fontSize: "11px", color: "#AAA", fontWeight: 500 }}>Sold out</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>

            {/* ══ FOOTER ══ */}
            {!loading && (
                <footer style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px 48px" }}>
                    {/* 1. Get Directions card */}
                    {data?.restaurant.location_url && (
                        <div style={{ marginBottom: "16px" }}>
                            <a href={data.restaurant.location_url} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: "14px", background: "white", border: "1px solid #EBEBEB", borderRadius: "14px", padding: "16px 20px", textDecoration: "none", transition: "border-color 0.12s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#CACACA")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EBEBEB")}>
                                <div style={{ width: 40, height: 40, borderRadius: "10px", background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111" }}>Get Directions</div>
                                    <div style={{ fontSize: "12px", color: "#999", marginTop: 2 }}>Open in Google Maps</div>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CACACA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                            </a>
                        </div>
                    )}

                    {/* 2. Follow us (social links) */}
                    {socials.length > 0 && sl && (
                        <div style={{ background: "white", border: "1px solid #EBEBEB", borderRadius: "16px", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Follow us</span>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {socials.map((type) => (
                                    <a key={type} href={buildUtmUrl(sl[type]!, slug)} target="_blank" rel="noopener noreferrer"
                                        onClick={() => onSocialClick(type)}
                                        style={{ width: "34px", height: "34px", borderRadius: "9px", border: "1px solid #EBEBEB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", color: "#BBB", textDecoration: "none", transition: "border-color 0.12s, color 0.12s" }}
                                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#CACACA"; el.style.color = "#555"; }}
                                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#EBEBEB"; el.style.color = "#BBB"; }}>
                                        {SOCIAL[type]}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. Powered by — always at the very bottom */}
                    <p style={{ fontSize: "11px", color: "#CACACA", textAlign: "center", marginTop: 4 }}>
                        Powered by{" "}
                        <a href={`https://spryon.com?utm_source=bio_menu&utm_medium=footer&utm_campaign=${encodeURIComponent(data?.restaurant.name ?? "restaurant")}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ color: accent, fontWeight: 600, textDecoration: "none" }}>
                            Spryon
                        </a>
                    </p>
                </footer>
            )}

            {/* Item modal */}
            {selectedItem && <ItemModal item={selectedItem} accent={accent} restaurantName={data?.restaurant.name ?? ""} currencySymbol={getCurrencySymbol(data?.restaurant.currency)} onClose={() => setSelectedItem(null)} />}

            <style>{`
                @keyframes skel { 0%,100%{opacity:1} 50%{opacity:0.5} }
                @keyframes fadein { from{opacity:0} to{opacity:1} }
                @keyframes slideup { from{transform:translateY(36px);opacity:0} to{transform:translateY(0);opacity:1} }
                @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
                * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
                ::-webkit-scrollbar { display: none; } scrollbar-width: none;
                input::placeholder { color: #C4C4C4; }
            `}</style>
        </div>
    );
}
