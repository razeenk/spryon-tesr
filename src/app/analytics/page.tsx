"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getToken, authHeaders } from "@/lib/api";
import { Send, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

interface WeeklyPoint { day: string; scans: number; sessions: number; }
interface HourPoint { hour: string; value: number; }
interface TopItem { name: string; scan_count: number; category_name: string | null; }
interface AnalyticsData {
    restaurant: { id: string; name: string; city: string | null };
    stats: { totalScans: number; totalSessions: number; topTable: { label: string; sessions: number } | null };
    weeklyScans: WeeklyPoint[];
    peakHours: HourPoint[];
    topItems: TopItem[];
    rangeLabel: string;
}

function Skel({ h = 14, w = "100%" }: { h?: number; w?: string }) {
    return <div style={{ height: h, width: w, background: "#F1F5F9", borderRadius: "6px", animation: "pulse 1.4s ease-in-out infinite" }} />;
}

function BarChart({ data, valueKey, labelKey, accentIndex }: {
    data: Record<string, number | string>[];
    valueKey: string;
    labelKey: string;
    accentIndex?: number;
}) {
    const vals = data.map((d) => Number(d[valueKey]));
    const maxVal = Math.max(...vals, 1);
    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "130px" }}>
            {data.map((d, i) => {
                const pct = (Number(d[valueKey]) / maxVal) * 100;
                const isAccent = accentIndex !== undefined ? i === accentIndex : pct === 100;
                return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", height: "100%" }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                            <div style={{
                                width: "100%",
                                height: `${Math.max(pct, 4)}%`,
                                background: isAccent ? "var(--accent)" : "var(--accent-soft)",
                                border: `1px solid ${isAccent ? "var(--accent-dark)" : "var(--border)"}`,
                                borderRadius: "5px 5px 3px 3px",
                                transition: "height 0.4s ease",
                                minHeight: "4px",
                            }} title={`${d[valueKey]}`} />
                        </div>
                        <span style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: isAccent ? 600 : 400, whiteSpace: "nowrap" }}>{String(d[labelKey])}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const tzOffset = typeof window !== "undefined" ? new Date().getTimezoneOffset() : 0;

    useEffect(() => {
        (async () => {
            const token = getToken();
            if (!token) { setLoading(false); return; }
            try {
                const res = await fetch(`${API}/api/analytics?tzOffset=${tzOffset}`, { headers: authHeaders() });
                const json = await res.json() as AnalyticsData & { ok: boolean };
                if (json.ok) setData(json);
            } finally { setLoading(false); }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendReport = async () => {
        const token = getToken();
        if (!token) return;
        setSending(true);
        try {
            const res = await fetch(`${API}/api/analytics/send-daily`, {
                method: "POST",
                headers: authHeaders(),
            });
            const json = await res.json<{ ok: boolean; message?: string; error?: string }>();
            setToast({ msg: json.message ?? json.error ?? "Done", ok: !!json.ok });
        } catch {
            setToast({ msg: "Network error", ok: false });
        } finally {
            setSending(false);
            setTimeout(() => setToast(null), 4000);
        }
    };

    const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Only show peak hours with activity, or all if all zero
    const peakHours = data?.peakHours ?? [];
    const hasActivity = peakHours.some((h) => h.value > 0);
    const shownHours = hasActivity ? peakHours.filter((_, i) => i % 2 === 0) : peakHours.filter((_, i) => i >= 3 && i <= 16 && i % 2 === 0);

    const topItems = data?.topItems ?? [];
    const maxScans = Math.max(...topItems.map((i) => i.scan_count), 1);

    return (
        <DashboardLayout title="Analytics">
            {/* Toast */}
            {toast && (
                <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.ok ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${toast.ok ? "#6EE7B7" : "#FECACA"}`, borderRadius: "10px", padding: "12px 18px", fontSize: "13.5px", color: toast.ok ? "#065F46" : "#991B1B", fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {toast.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {toast.msg}
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="page-title">Analytics</div>
                    <div className="page-subtitle">
                        {loading ? "Loading…" : `Last 7 days · ${data?.restaurant.name ?? ""}`}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-secondary" onClick={sendReport} disabled={sending} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {sending ? "Sending…" : <><Send size={13} /> Send Report</>}
                    </button>
                    <button className="btn-secondary" onClick={() => window.location.reload()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="stats-grid">
                {[
                    {
                        label: "Total Scans",
                        value: loading ? null : (data?.stats.totalScans ?? 0).toLocaleString(),
                        delta: "Item views (all time)",
                        up: false,
                    },
                    {
                        label: "Sessions (7d)",
                        value: loading ? null : (data?.stats.totalSessions ?? 0).toLocaleString(),
                        delta: data?.rangeLabel ?? "—",
                        up: false,
                    },
                    {
                        label: "Top Table",
                        value: loading ? null : (data?.stats.topTable?.label ?? "—"),
                        delta: data?.stats.topTable ? `${data.stats.topTable.sessions} session${data.stats.topTable.sessions !== 1 ? "s" : ""}` : "No data yet",
                        up: false,
                    },
                    {
                        label: "Menu Items Tracked",
                        value: loading ? null : (data?.topItems.length ?? 0).toString(),
                        delta: "Items with scan data",
                        up: false,
                    },
                ].map((s, i) => (
                    <div key={i} className="card stat">
                        <div className="stat-header"><span className="stat-label">{s.label}</span></div>
                        {s.value === null ? (
                            <div style={{ marginTop: "10px" }}><Skel h={24} w="60%" /><div style={{ marginTop: "8px" }}><Skel h={11} w="80%" /></div></div>
                        ) : (
                            <>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-delta">{s.delta}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="dashboard-grid">
                {/* Weekly scans */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Sessions This Week</h3>
                        <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>{loading ? "—" : data?.rangeLabel}</span>
                    </div>
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "130px", marginTop: "8px" }}>
                            {[55, 35, 75, 45, 85, 60, 40].map((h, i) => <div key={i} style={{ flex: 1, background: "#F1F5F9", borderRadius: "5px", height: `${h}%`, animation: "pulse 1.4s ease-in-out infinite" }} />)}
                        </div>
                    ) : (
                        <div style={{ marginTop: "8px" }}>
                            {(data?.weeklyScans.every((d) => d.sessions === 0)) ? (
                                <div style={{ height: "130px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "13.5px" }}>No sessions yet this week</div>
                            ) : (
                                <BarChart data={(data?.weeklyScans ?? []) as Record<string, number | string>[]} valueKey="sessions" labelKey="day" />
                            )}
                        </div>
                    )}
                </div>

                {/* Peak hours */}
                <div className="card">
                    <div className="section-header">
                        <h3 className="section-title">Peak Hours</h3>
                        <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>{todayLabel}</span>
                    </div>
                    {loading ? (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "130px", marginTop: "8px" }}>
                            {[30, 55, 80, 65, 40, 70, 90, 75, 50].map((h, i) => <div key={i} style={{ flex: 1, background: "#F1F5F9", borderRadius: "5px", height: `${h}%`, animation: "pulse 1.4s ease-in-out infinite" }} />)}
                        </div>
                    ) : (
                        <div style={{ marginTop: "8px" }}>
                            {!hasActivity ? (
                                <div style={{ height: "130px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "13.5px" }}>No activity today yet</div>
                            ) : (
                                <BarChart data={shownHours as Record<string, number | string>[]} valueKey="value" labelKey="hour" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Top menu items */}
            <div className="card" style={{ padding: "20px 0 0" }}>
                <div className="section-header" style={{ padding: "0 20px 14px" }}>
                    <h3 className="section-title">Top Menu Items</h3>
                    <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>By scan count</span>
                </div>
                {loading ? (
                    <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {Array(5).fill(0).map((_, i) => <Skel key={i} h={14} />)}
                    </div>
                ) : topItems.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13.5px" }}>
                        No menu items yet. Add items to your menu to see scan data here.
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: "20px" }}>#</th>
                                <th>Item</th>
                                <th>Category</th>
                                <th style={{ paddingRight: "20px" }}>Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topItems.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ paddingLeft: "20px", color: "var(--muted-light)", fontWeight: 600, width: "40px" }}>{i + 1}</td>
                                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                                    <td>
                                        {item.category_name ? (
                                            <span style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "2px 8px", fontSize: "12px", color: "var(--muted)" }}>
                                                {item.category_name}
                                            </span>
                                        ) : <span style={{ color: "var(--muted-light)" }}>—</span>}
                                    </td>
                                    <td style={{ paddingRight: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500, minWidth: "28px" }}>{item.scan_count}</span>
                                            <div style={{ flex: 1, height: "4px", background: "var(--bg)", borderRadius: "99px", overflow: "hidden", minWidth: "60px" }}>
                                                <div style={{ width: `${(item.scan_count / maxScans) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: "99px" }} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </DashboardLayout>
    );
}
