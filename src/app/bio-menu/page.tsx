"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useSearchParams } from "next/navigation";
import { apiMe, apiUpdateRestaurantConfig, apiFetch } from "@/lib/api";
import {
    Link2, BarChart3, Eye, UtensilsCrossed, Share2, ExternalLink,
    MapPin, BarChart2, Copy, Check, QrCode, Globe, FileText, ExternalLink as OpenIcon
} from "lucide-react";

interface AnalyticsData {
    counts: Record<string, number>;
    recent: { event: string; device_type: string | null; referrer: string | null; created_at: number }[];
}

function SectionCard({ title, description, icon, children, action }: {
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <div style={{
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
            <div style={{
                padding: "18px 20px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        background: "var(--accent-soft)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--accent-dark)", flexShrink: 0,
                    }}>
                        {icon}
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{title}</div>
                        {description && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{description}</div>}
                    </div>
                </div>
                {action && <div style={{ flexShrink: 0 }}>{action}</div>}
            </div>
            <div style={{ padding: "20px" }}>{children}</div>
        </div>
    );
}

function BioMenuContent() {
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<"config" | "analytics">(
        searchParams.get("tab") === "analytics" ? "analytics" : "config"
    );
    useEffect(() => {
        setActiveTab(searchParams.get("tab") === "analytics" ? "analytics" : "config");
    }, [searchParams]);

    // Config state
    const [restaurantSlug, setRestaurantSlug] = useState("");
    const [restaurantName, setRestaurantName] = useState("");
    const [pageTitle, setPageTitle] = useState("");
    const [pageDesc, setPageDesc] = useState("");
    const [locationUrl, setLocationUrl] = useState("");
    const [linkCopied, setLinkCopied] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [platformUrl, setPlatformUrl] = useState("");

    // Analytics state
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    useEffect(() => {
        apiMe().then((res) => {
            if (res.data) {
                const r = res.data.restaurant as Record<string, unknown> | null;
                if (!r) return;
                if (r.name) setRestaurantName(r.name as string);
                if (r.slug) setRestaurantSlug(r.slug as string);
                if (r.page_title) setPageTitle(r.page_title as string);
                if (r.page_description) setPageDesc(r.page_description as string);
                if (r.location_url) setLocationUrl(r.location_url as string);
                if (res.data.platformUrl) setPlatformUrl(res.data.platformUrl);
            }
        });
    }, []);

    useEffect(() => {
        if (activeTab !== "analytics") return;
        setAnalyticsLoading(true);
        apiFetch<AnalyticsData>("/api/restaurant/analytics").then((res: { data?: AnalyticsData; error?: string; status: number }) => {
            if (res.data) setAnalytics(res.data);
            setAnalyticsLoading(false);
        });
    }, [activeTab]);

    const origin = platformUrl || (typeof window !== "undefined" ? window.location.origin : "https://spryon.app");
    const publicUrl = `${origin}/${restaurantSlug || "your-slug"}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(publicUrl)}&size=200x200&margin=10&color=111827&bgcolor=FFFFFF`;

    const save = async () => {
        setSaving(true); setSaveError("");
        const res = await apiUpdateRestaurantConfig({
            page_title: pageTitle,
            page_description: pageDesc,
            slug: restaurantSlug || undefined,
            location_url: locationUrl,
        });
        setSaving(false);
        if (res.error) { setSaveError(res.error); }
        else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    const statCards = [
        { label: "Total Visits", icon: <Eye size={16} />, key: "menu_visit", desc: "Menu opens", color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Item Views", icon: <UtensilsCrossed size={16} />, key: "item_view", desc: "Items tapped", color: "#3B82F6", bg: "#EFF6FF" },
        { label: "Shares", icon: <Share2 size={16} />, key: "share_click", desc: "Share clicks", color: "#10B981", bg: "#ECFDF5" },
        { label: "Social Clicks", icon: <ExternalLink size={16} />, key: "social_click", desc: "Socials clicked", color: "#F59E0B", bg: "#FFFBEB" },
    ];

    const TAB_ITEMS = [
        { id: "config", label: "Configuration", icon: <Link2 size={14} /> },
        { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} /> },
    ];

    return (
        <DashboardLayout title="Bio Menu">
            {/* Page header */}
            <div className="page-header">
                <div>
                    <div className="page-title">Bio Menu</div>
                    <div className="page-subtitle">Your shareable public menu link — for Instagram, WhatsApp, anywhere</div>
                </div>
                {activeTab === "config" && (
                    <button
                        className="btn-primary"
                        onClick={save}
                        disabled={saving}
                        style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 130 }}
                    >
                        {saving
                            ? <><span style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Saving…</>
                            : saved
                                ? <><Check size={14} /> Saved!</>
                                : "Save Changes"
                        }
                    </button>
                )}
            </div>

            {saveError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#991B1B" }}>
                    {saveError}
                </div>
            )}

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 2, background: "#F1F5F9", padding: 4, borderRadius: 10, width: "fit-content" }}>
                {TAB_ITEMS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id as "config" | "analytics")}
                        style={{
                            padding: "7px 16px", borderRadius: 7, cursor: "pointer",
                            fontWeight: 600, fontSize: 13, border: "none", fontFamily: "inherit",
                            display: "flex", alignItems: "center", gap: 6,
                            background: activeTab === t.id ? "white" : "transparent",
                            color: activeTab === t.id ? "var(--text)" : "var(--muted)",
                            boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* ══ CONFIG TAB ══ */}
            {activeTab === "config" && (
                <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* ── SECTION 1: Shareable Menu Card ── */}
                    <div style={{
                        background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                        border: "1px solid #A7F3D0",
                        borderRadius: 16,
                        padding: "28px 28px",
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap" }}>
                            {/* QR code */}
                            <div style={{ flexShrink: 0 }}>
                                <div style={{
                                    background: "white", borderRadius: 14,
                                    padding: 12,
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                                }}>
                                    {restaurantSlug
                                        ? <img src={qrUrl} alt="QR Code" width={160} height={160} style={{ display: "block", borderRadius: 8 }} />
                                        : (
                                            <div style={{ width: 160, height: 160, borderRadius: 8, background: "#F3F4F6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                                <QrCode size={32} color="#CBD5E1" />
                                                <div style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", lineHeight: 1.4, padding: "0 8px" }}>Set a slug to generate your QR</div>
                                            </div>
                                        )
                                    }
                                </div>
                            </div>

                            {/* Info side */}
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <div style={{ fontSize: 16, fontWeight: 700, color: "#065F46", marginBottom: 4 }}>Your Shareable Menu</div>
                                <div style={{ fontSize: 13, color: "#047857", marginBottom: 20, lineHeight: 1.6 }}>
                                    Share this link in your Instagram bio, WhatsApp status, Google Business, or anywhere online. Guests scan or click to view your live menu.
                                </div>

                                {/* URL display row */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <div style={{
                                        flex: 1, minWidth: 200,
                                        background: "white", border: "1px solid #A7F3D0", borderRadius: 9,
                                        padding: "10px 14px", fontSize: 13, fontFamily: "monospace",
                                        color: "#065F46", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {publicUrl}
                                    </div>
                                    <button
                                        onClick={copyLink}
                                        style={{
                                            padding: "10px 16px", borderRadius: 9, cursor: "pointer",
                                            fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                                            background: linkCopied ? "#059669" : "#10B981", color: "white",
                                            border: "none", whiteSpace: "nowrap",
                                            display: "flex", alignItems: "center", gap: 6,
                                            transition: "background 0.15s",
                                        }}
                                    >
                                        {linkCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                                    </button>
                                    <a
                                        href={publicUrl} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            padding: "10px 14px", background: "white",
                                            border: "1px solid #A7F3D0", borderRadius: 9,
                                            fontWeight: 600, fontSize: 13, color: "#065F46",
                                            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
                                        }}
                                    >
                                        <OpenIcon size={14} /> Preview
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION 2: Slug ── */}
                    <SectionCard
                        title="Menu URL Slug"
                        description="The unique identifier for your menu link"
                        icon={<Link2 size={16} />}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Visual URL builder */}
                            <div style={{
                                display: "flex", alignItems: "center", gap: 0,
                                border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden",
                                focusWithin: "border-color: var(--accent)",
                            } as React.CSSProperties}>
                                <div style={{
                                    padding: "10px 14px", background: "#F8FAFC",
                                    borderRight: "1px solid var(--border)",
                                    fontSize: 13, color: "var(--muted)", fontFamily: "monospace",
                                    whiteSpace: "nowrap", userSelect: "none",
                                }}>
                                    {origin}/
                                </div>
                                <input
                                    value={restaurantSlug}
                                    onChange={(e) => setRestaurantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    placeholder="your-restaurant-name"
                                    style={{
                                        flex: 1, border: "none", outline: "none", padding: "10px 14px",
                                        fontFamily: "monospace", fontSize: 13, background: "transparent",
                                        color: "var(--text)",
                                    }}
                                />
                            </div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>
                                Only lowercase letters, numbers, and hyphens. Must be unique across Spryon.
                            </div>
                            {restaurantSlug && (
                                <div style={{
                                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                                    borderRadius: 8, padding: "9px 14px",
                                    fontSize: 13, fontFamily: "monospace", color: "#15803D",
                                }}>
                                    ✓ Preview: <strong>{origin}/{restaurantSlug}</strong>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* ── SECTION 3: Location ── */}
                    <SectionCard
                        title="Location"
                        description="Add a Google Maps embed URL for a map and directions button on your menu"
                        icon={<MapPin size={16} />}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <input
                                className="input"
                                placeholder="https://www.google.com/maps/embed?pb=..."
                                value={locationUrl}
                                onChange={(e) => setLocationUrl(e.target.value)}
                                style={{ width: "100%", fontFamily: "monospace", fontSize: 12.5 }}
                            />
                            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                                In Google Maps → click <strong>Share</strong> → <strong>Embed a map</strong> → copy the <code style={{ background: "#F3F4F6", padding: "1px 5px", borderRadius: 4, fontSize: 11 }}>src</code> URL from the iframe.
                            </div>
                            {locationUrl && locationUrl.includes("google.com/maps/embed") && (
                                <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", marginTop: 4 }}>
                                    <iframe
                                        src={locationUrl}
                                        width="100%"
                                        height="200"
                                        style={{ border: 0, display: "block" }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    {/* ── SECTION 4: SEO & Link Preview ── */}
                    <SectionCard
                        title="SEO & Link Preview"
                        description="Controls the title and description shown when guests share your menu on social media"
                        icon={<FileText size={16} />}
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Page Title</label>
                                <input
                                    className="input"
                                    placeholder={restaurantName ? `Our Menu | ${restaurantName}` : "e.g. Our Menu | Bella Vista"}
                                    value={pageTitle}
                                    onChange={(e) => setPageTitle(e.target.value)}
                                    style={{ width: "100%" }}
                                />
                                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Shown in the browser tab. Leave blank for the default.</div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>Description</label>
                                <textarea
                                    className="input"
                                    rows={2}
                                    placeholder={restaurantName ? `Scan to explore our full menu at ${restaurantName}` : "e.g. Scan to explore our full menu"}
                                    value={pageDesc}
                                    onChange={(e) => setPageDesc(e.target.value)}
                                    style={{ width: "100%", resize: "vertical", lineHeight: 1.5 }}
                                />
                                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Shown in link previews when guests share your menu URL.</div>
                            </div>

                            {/* Social preview card */}
                            {(pageTitle || pageDesc || restaurantName) && (
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>Preview</div>
                                    <div style={{
                                        border: "1px solid #E1E8EF", borderRadius: 12, overflow: "hidden",
                                        maxWidth: 440, fontFamily: "sans-serif",
                                    }}>
                                        <div style={{ background: "#F0F2F5", height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Globe size={24} color="#BCC0C4" />
                                        </div>
                                        <div style={{ padding: "10px 14px 12px", background: "#F8F9FA", borderTop: "1px solid #E1E8EF" }}>
                                            <div style={{ fontSize: 11, color: "#90949C", marginBottom: 3 }}>
                                                {origin.replace(/^https?:\/\//, "")}/{restaurantSlug || "your-slug"}
                                            </div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: "#1C1E21", marginBottom: 3 }}>
                                                {pageTitle || (restaurantName ? `Our Menu | ${restaurantName}` : "Restaurant Menu")}
                                            </div>
                                            <div style={{ fontSize: 13, color: "#606770", lineHeight: 1.4 }}>
                                                {pageDesc || (restaurantName ? `Scan to explore our full menu at ${restaurantName}` : "View the full menu")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
            )}

            {/* ══ ANALYTICS TAB ══ */}
            {activeTab === "analytics" && (
                <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Live badge */}
                    <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        <style>{`@keyframes pulse-dot{0%,100%{box-shadow:0 0 0 3px #BBF7D0}50%{box-shadow:0 0 0 6px #BBF7D020}}`}</style>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", flexShrink: 0, animation: "pulse-dot 2s infinite" }} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#065F46" }}>Analytics tracking is active on your Bio Menu</div>
                    </div>

                    {/* Stat grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                        {statCards.map((s) => (
                            <div key={s.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, marginBottom: 12 }}>
                                    {s.icon}
                                </div>
                                <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 3 }}>
                                    {analyticsLoading ? "…" : (analytics?.counts[s.key] ?? 0).toLocaleString()}
                                </div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>{s.label}</div>
                                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{s.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent events */}
                    <SectionCard title="Recent Events" description="Last 50 events from your bio menu" icon={<BarChart3 size={16} />}>
                        <div style={{ margin: "-20px", marginTop: -20 }}>
                            {analyticsLoading ? (
                                <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Loading…</div>
                            ) : !analytics || analytics.recent.length === 0 ? (
                                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BarChart2 size={32} color="#CBD5E1" /></div>
                                    <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>No events yet</div>
                                    <div style={{ fontSize: 12, color: "var(--muted-light)" }}>Events will appear here once guests visit your bio menu link.</div>
                                </div>
                            ) : analytics.recent.map((ev, i) => {
                                const eventColors: Record<string, string> = { menu_visit: "#8B5CF6", item_view: "#3B82F6", share_click: "#10B981", social_click: "#F59E0B", engagement: "#EF4444" };
                                const color = eventColors[ev.event] ?? "#9CA3AF";
                                const date = new Date(ev.created_at * 1000);
                                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
                                return (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 20px", borderBottom: "1px solid #F8FAFC" }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                        <code style={{ background: "#F3F4F6", borderRadius: 5, padding: "2px 8px", fontSize: 12, color: "#374151", flexShrink: 0 }}>{ev.event}</code>
                                        <span style={{ fontSize: 12, color: "var(--muted)", flexShrink: 0 }}>{ev.device_type ?? "—"}</span>
                                        <span style={{ fontSize: 12, color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.referrer || "direct"}</span>
                                        <span style={{ fontSize: 11, color: "var(--muted-light)", flexShrink: 0 }}>{dateStr} {timeStr}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </SectionCard>

                    {/* Legend */}
                    <SectionCard title="Events Being Tracked" icon={<BarChart3 size={16} />}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0, margin: "-20px" }}>
                            {[
                                { event: "menu_visit", desc: "When a guest opens your bio menu link", color: "#8B5CF6" },
                                { event: "item_view", desc: "When a guest taps or hovers a menu item", color: "#3B82F6" },
                                { event: "share_click", desc: "When the Share Menu button is clicked", color: "#10B981" },
                                { event: "social_click", desc: "When any social link is clicked", color: "#F59E0B" },
                                { event: "engagement", desc: "When a guest scrolls past 50% of the menu", color: "#EF4444" },
                            ].map((e, i, arr) => (
                                <div key={e.event} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < arr.length - 1 ? "1px solid #F8FAFC" : "none" }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                                    <code style={{ background: "#F3F4F6", borderRadius: 5, padding: "2px 8px", fontSize: 12, color: "#374151", flexShrink: 0 }}>{e.event}</code>
                                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{e.desc}</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            )}
        </DashboardLayout>
    );
}

export default function BioMenuPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BioMenuContent />
        </Suspense>
    );
}
