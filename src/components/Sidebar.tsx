"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getToken, clearToken, authHeaders } from "@/lib/api";
import {
    UtensilsCrossed, FolderOpen, Palette, CheckCircle2, XCircle,
    LayoutDashboard, ClipboardList, Table2, Share2, BarChart2,
    ChevronDown, ChevronsUpDown, Settings, LogOut, X, Layers,
    Link2, BarChart3, CreditCard,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";


interface RestaurantInfo { name: string; logo_url?: string | null; is_open?: number; }


function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Sidebar({
    isOpen = false,
    onClose,
}: {
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);       // profile dropdown
    const [menuExpanded, setMenuExpanded] = useState(false); // sidebar menu tree
    const [bioMenuExpanded, setBioMenuExpanded] = useState(false); // bio menu tree
    const [isOpenStatus, setIsOpenStatus] = useState(true);
    const [globalLogo, setGlobalLogo] = useState<string | null>(null);
    const [globalTitle, setGlobalTitle] = useState<string | null>(null);
    const footerRef = useRef<HTMLDivElement>(null);

    // Auto-expand when we're on a /menu route
    useEffect(() => {
        if (pathname === "/menu" || pathname.startsWith("/menu/")) setMenuExpanded(true);
        if (pathname === "/bio-menu" || pathname.startsWith("/bio-menu/")) setBioMenuExpanded(true);
    }, [pathname]);

    useEffect(() => {
        const token = getToken();
        if (!token) return;
        fetch(`${API}/auth/me`, { headers: authHeaders() })
            .then((r) => r.json() as Promise<{ ok: boolean; restaurant: RestaurantInfo | null }>)
            .then((d) => {
                if (d.ok && d.restaurant) {
                    setRestaurant(d.restaurant);
                    setIsOpenStatus((d.restaurant.is_open ?? 1) === 1);
                }
            })
            .catch(() => { });

        // Fetch global logo if no restaurant logo
        fetch(`${API}/api/public/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    if (data.settings.global_logo_url) setGlobalLogo(data.settings.global_logo_url);
                    if (data.settings.global_title) setGlobalTitle(data.settings.global_title);
                }
            })
            .catch(() => { });
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (footerRef.current && !footerRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        clearToken();
        router.replace("/login");
    };

    const toggleOpen = async () => {
        const next = !isOpenStatus;
        setIsOpenStatus(next);
        try {
            await fetch(`${API}/api/restaurant/config`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ is_open: next ? 1 : 0 }),
            });
        } catch { setIsOpenStatus(!next); } // revert on error
    };

    const restaurantName = restaurant?.name ?? "Your Restaurant";
    const logoUrl = restaurant?.logo_url ? `${API}${restaurant.logo_url}` : null;
    const initials = getInitials(restaurantName);

    return (
        <aside className={`sidebar${isOpen ? " sidebar-open" : ""}`}>
            {/* Logo / Brand */}
            <div className="sidebar-logo">
                {globalLogo ? (
                    <img src={globalLogo.startsWith("http") ? globalLogo : `${API}${globalLogo}`} alt="Spryon" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                    <div className="sidebar-logo-mark">
                        <Layers size={16} color="white" strokeWidth={2.5} />
                    </div>
                )}
                <span className="sidebar-logo-text" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{globalTitle || "Spryon"}</span>
                {onClose && (
                    <button onClick={onClose} className="sidebar-close-btn" aria-label="Close menu">
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Main</div>
                <Link href="/" onClick={onClose}>
                    <div className={`nav-item${pathname === "/" ? " active" : ""}`}>
                        <LayoutDashboard size={16} />
                        Dashboard
                    </div>
                </Link>

                {/* ── Menu tree ── */}
                <div>
                    <div className={`nav-item${pathname === "/menu" ? " active" : ""}`}
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => setMenuExpanded((o) => !o)}>
                        <ClipboardList size={16} />
                        <span style={{ flex: 1 }}>Menu</span>
                        <ChevronDown size={12} style={{ color: "var(--muted-light)", transform: menuExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }} />
                    </div>
                    {menuExpanded && (() => {
                        const currentTab = pathname === "/menu" ? (searchParams.get("tab") ?? "dishes") : "";
                        const sub = (label: string, tab: string, icon: React.ReactNode) => {
                            const active = pathname === "/menu" && currentTab === tab;
                            return (
                                <Link key={tab} href={`/menu${tab === "dishes" ? "" : `?tab=${tab}`}`} onClick={onClose} style={{ textDecoration: "none" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "7px",
                                        padding: "5px 10px 5px 28px", borderRadius: "7px", fontSize: "13px",
                                        color: active ? "var(--accent)" : "var(--muted)",
                                        fontWeight: active ? 700 : 500, cursor: "pointer",
                                        background: active ? "var(--accent-soft)" : "none",
                                    }}
                                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-soft)" : "none"; }}>
                                        <span style={{ display: "flex", alignItems: "center" }}>{icon}</span> {label}
                                    </div>
                                </Link>
                            );
                        };
                        return (
                            <div style={{ borderLeft: "1.5px solid var(--border)", marginLeft: "22px", paddingLeft: "2px", marginBottom: "2px" }}>
                                {sub("Dishes", "dishes", <UtensilsCrossed size={13} />)}
                                {sub("Categories", "categories", <FolderOpen size={13} />)}
                                {sub("Menu Config", "config", <Palette size={13} />)}
                            </div>
                        );
                    })()}
                </div>
                <Link href="/tables" onClick={onClose}>
                    <div className={`nav-item${pathname === "/tables" ? " active" : ""}`}>
                        <Table2 size={16} />
                        Tables
                    </div>
                </Link>

                {/* ── Bio Menu tree ── */}
                <div>
                    <div className={`nav-item${pathname === "/bio-menu" ? " active" : ""}`}
                        style={{ cursor: "pointer", userSelect: "none" }}
                        onClick={() => setBioMenuExpanded((o) => !o)}>
                        <Share2 size={16} />
                        <span style={{ flex: 1 }}>Bio Menu</span>
                        <ChevronDown size={12} style={{ color: "var(--muted-light)", transform: bioMenuExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", flexShrink: 0 }} />
                    </div>
                    {bioMenuExpanded && (() => {
                        const currentTab = pathname === "/bio-menu" ? (searchParams.get("tab") ?? "config") : "";
                        const bsub = (label: string, tab: string, icon: React.ReactNode) => {
                            const active = pathname === "/bio-menu" && currentTab === tab;
                            return (
                                <Link key={tab} href={`/bio-menu?tab=${tab}`} onClick={onClose} style={{ textDecoration: "none" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "7px",
                                        padding: "5px 10px 5px 28px", borderRadius: "7px", fontSize: "13px",
                                        color: active ? "var(--accent)" : "var(--muted)",
                                        fontWeight: active ? 700 : 500, cursor: "pointer",
                                        background: active ? "var(--accent-soft)" : "none",
                                    }}
                                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-soft)" : "none"; }}>
                                        <span style={{ display: "flex", alignItems: "center" }}>{icon}</span> {label}
                                    </div>
                                </Link>
                            );
                        };
                        return (
                            <div style={{ borderLeft: "1.5px solid var(--border)", marginLeft: "22px", paddingLeft: "2px", marginBottom: "2px" }}>
                                {bsub("Config", "config", <Link2 size={13} />)}
                                {bsub("Analytics", "analytics", <BarChart3 size={13} />)}
                            </div>
                        );
                    })()}
                </div>
                <div className="nav-section-label" style={{ marginTop: "8px" }}>Insights</div>
                <Link href="/analytics" onClick={onClose}>
                    <div className={`nav-item${pathname === "/analytics" ? " active" : ""}`}>
                        <BarChart2 size={16} />
                        Analytics
                    </div>
                </Link>
            </nav>

            {/* Footer — restaurant info + logout dropdown */}
            <div className="sidebar-footer" ref={footerRef} style={{ position: "relative" }}>

                {/* Dropdown menu */}
                {menuOpen && (
                    <div style={{
                        position: "absolute", bottom: "calc(100% + 8px)", left: "12px", right: "12px",
                        background: "white", border: "1px solid var(--border)", borderRadius: "10px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden", zIndex: 50,
                    }}>
                        {/* Settings link */}
                        <Link href="/settings" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "11px 14px", borderBottom: "1px solid var(--border)",
                                fontSize: "13.5px", color: "var(--text)", fontWeight: 500, cursor: "pointer",
                            }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                                <Settings size={14} />
                                Settings
                            </div>
                        </Link>

                        {/* Subscription link */}
                        <Link href="/subscription" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "11px 14px", borderBottom: "1px solid var(--border)",
                                fontSize: "13.5px", color: "var(--text)", fontWeight: 500, cursor: "pointer",
                            }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                                <CreditCard size={14} />
                                <span style={{ flex: 1 }}>Subscription</span>
                                <span style={{ fontSize: "10px", fontWeight: 700, background: "#F3F4F6", color: "#6B7280", padding: "2px 7px", borderRadius: "99px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    {(restaurant as any)?.plan_short_name || "FREE"}
                                </span>
                            </div>
                        </Link>

                        {/* Open/Close toggle */}
                        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Restaurant Status</div>
                            <button onClick={toggleOpen} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
                                background: "none", border: "none", cursor: "pointer", padding: 0,
                            }}>
                                <span style={{ fontSize: "13.5px", fontWeight: 500, color: isOpenStatus ? "#16A34A" : "#DC2626", display: "flex", alignItems: "center", gap: "5px" }}>
                                    {isOpenStatus ? <><CheckCircle2 size={14} />&nbsp;Open</> : <><XCircle size={14} />&nbsp;Closed</>}
                                </span>
                                {/* Toggle pill */}
                                <div style={{
                                    width: "36px", height: "20px", borderRadius: "10px",
                                    background: isOpenStatus ? "var(--accent)" : "#E5E7EB",
                                    position: "relative", transition: "background 0.2s",
                                }}>
                                    <div style={{
                                        width: "14px", height: "14px", borderRadius: "50%", background: "white",
                                        position: "absolute", top: "3px",
                                        left: isOpenStatus ? "19px" : "3px",
                                        transition: "left 0.2s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                                    }} />
                                </div>
                            </button>
                        </div>
                        {/* Logout */}
                        <button onClick={handleLogout} style={{
                            display: "flex", alignItems: "center", gap: "8px", width: "100%",
                            padding: "11px 14px", background: "none", border: "none", cursor: "pointer",
                            fontSize: "13.5px", color: "var(--danger)", fontWeight: 500, textAlign: "left",
                        }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                            <LogOut size={14} />
                            Log out
                        </button>
                    </div>
                )}

                {/* Clickable restaurant card */}
                <div className="sidebar-user" onClick={() => setMenuOpen((o) => !o)} style={{ cursor: "pointer" }}>
                    {/* Logo or initials */}
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoUrl} alt={restaurantName}
                            style={{ width: "32px", height: "32px", borderRadius: "8px", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
                    ) : (
                        <div className="avatar">{initials}</div>
                    )}
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name" style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {restaurantName}
                        </div>
                        <div className="sidebar-user-role" style={{ color: isOpenStatus ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                            {isOpenStatus ? "Open" : "Closed"}
                        </div>
                    </div>
                    {/* Chevron */}
                    <ChevronsUpDown size={12} style={{ color: "var(--muted-light)", flexShrink: 0, transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
                </div>
            </div>
        </aside>
    );
}
