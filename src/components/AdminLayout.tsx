"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiAdminMe, adminClearToken } from "@/lib/adminApi";
import {
    LayoutDashboard, Store, CreditCard, Users2, BarChart2,
    ScrollText, Settings, LogOut, ChevronRight, ShieldCheck,
} from "lucide-react";
import Link from "next/link";

const NAV = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Restaurants", href: "/admin/restaurants", icon: Store },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    { label: "Affiliates", href: "/admin/affiliates", icon: Users2 },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [globalLogo, setGlobalLogo] = useState<string | null>(null);
    const [globalTitle, setGlobalTitle] = useState<string | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        apiAdminMe().then((res) => {
            if (res.data?.admin) {
                setAdminName(res.data.admin.name);
                setAdminEmail(res.data.admin.email);
                setChecking(false);
            } else {
                router.replace("/admin/login");
            }
        }).catch(() => router.replace("/admin/login"));
        
        // Fetch global logo if present
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        fetch(`${API}/api/public/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    if (data.settings.global_logo_url) setGlobalLogo(data.settings.global_logo_url);
                    if (data.settings.global_title) setGlobalTitle(data.settings.global_title);
                }
            })
            .catch(() => {});
    }, [router]);

    const logout = () => { adminClearToken(); router.replace("/admin/login"); };

    if (checking) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #334155", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", height: "100vh", background: "#0F172A", fontFamily: "Inter, system-ui, sans-serif", overflow: "hidden" }}>
            {/* ─── Sidebar ─── */}
            <aside style={{ width: 240, background: "#0F1629", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", flexShrink: 0 }}>
                {/* Logo */}
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1E293B" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {globalLogo ? (
                            <img src={globalLogo.startsWith("http") ? globalLogo : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}${globalLogo}`} alt="Spryon Admin" style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #34D399, #059669)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <ShieldCheck size={17} color="white" />
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{globalTitle || "Spryon"}</div>
                            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600, letterSpacing: "0.05em" }}>SUPER ADMIN</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "12px 10px", overflow: "auto" }}>
                    {NAV.map(({ label, href, icon: Icon }) => {
                        const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
                        return (
                            <Link key={href} href={href} style={{ textDecoration: "none" }}>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    padding: "9px 12px", borderRadius: 8, marginBottom: 2,
                                    background: active ? "rgba(52,211,153,0.12)" : "transparent",
                                    color: active ? "#34D399" : "#94A3B8",
                                    fontWeight: active ? 600 : 500, fontSize: 13.5,
                                    transition: "all 0.12s", cursor: "pointer",
                                    borderLeft: active ? "3px solid #34D399" : "3px solid transparent",
                                }}>
                                    <Icon size={15} />
                                    {label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: "12px 10px 16px", borderTop: "1px solid #1E293B" }}>
                    <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminName}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminEmail}</div>
                    </div>
                    <button onClick={logout} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 12px", borderRadius: 8, background: "transparent",
                        border: "none", cursor: "pointer", color: "#64748B", fontSize: 13,
                        fontFamily: "inherit", transition: "all 0.12s",
                    }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F87171"; (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#64748B"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ─── Main ─── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Topbar */}
                <header style={{ height: 54, background: "#0F1629", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", padding: "0 24px", gap: 8, flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: "#64748B" }}>
                        {NAV.find((n) => pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href)))?.label ?? "Admin"}
                    </div>
                    <ChevronRight size={13} color="#475569" />
                    <div style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
                        {pathname.split("/").pop()?.replace(/-/g, " ")}
                    </div>
                    <div style={{ flex: 1 }} />
                    <div style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11.5, fontWeight: 700, color: "#34D399", letterSpacing: "0.04em" }}>
                        SUPER ADMIN
                    </div>
                </header>

                {/* Content */}
                <main style={{ flex: 1, overflow: "auto", padding: "24px", background: "#0F172A" }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
