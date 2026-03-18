"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminRestaurants, apiAdminUpdateRestaurantStatus, apiAdminDeleteRestaurant } from "@/lib/adminApi";
import { Search, RefreshCw, CheckCircle2, XCircle, Pause, Ban, RotateCcw, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Status = "all" | "active" | "pending" | "suspended" | "banned";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
    pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    suspended: { label: "Suspended", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
    banned: { label: "Banned", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

function Badge({ status }: { status: string }) {
    const s = STATUS_MAP[status] ?? { label: status, color: "#94A3B8", bg: "#1E293B" };
    return (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 20, display: "inline-block" }}>
            {s.label}
        </span>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Restaurant = Record<string, any>;

function RestaurantsContent() {
    const sp = useSearchParams();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState<Status>((sp.get("status") as Status) ?? "all");
    const [actingOn, setActingOn] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const params: Record<string, string> = { page: String(page) };
        if (status !== "all") params.status = status;
        if (search) params.search = search;
        const res = await apiAdminRestaurants(params);
        if (res.data) { setRestaurants(res.data.restaurants as Restaurant[]); setTotal(res.data.total); }
        setLoading(false);
    }, [page, status, search]);

    useEffect(() => { load(); }, [load]);

    const doStatus = async (id: string, newStatus: string, reason?: string) => {
        setActingOn(id);
        await apiAdminUpdateRestaurantStatus(id, newStatus, reason);
        setActingOn(null);
        load();
    };
    const doDelete = async (id: string, name: string) => {
        if (!confirm(`Permanently delete "${name}" and all its data? This cannot be undone.`)) return;
        setActingOn(id);
        await apiAdminDeleteRestaurant(id);
        setActingOn(null);
        load();
    };

    const totalPages = Math.ceil(total / 30);

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ maxWidth: 1100 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Restaurants</div>
                        <div style={{ fontSize: 13, color: "#64748B" }}>{total} total restaurants</div>
                    </div>
                    <button onClick={load} style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 9, padding: "8px 14px", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontFamily: "inherit" }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                        <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name or email…"
                            style={{ width: "100%", background: "#0F1629", border: "1px solid #1E293B", borderRadius: 9, padding: "9px 12px 9px 34px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: 4, background: "#0F1629", border: "1px solid #1E293B", borderRadius: 9, padding: 4 }}>
                        {(["all", "active", "pending", "suspended", "banned"] as Status[]).map((s) => (
                            <button key={s} onClick={() => { setStatus(s); setPage(1); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", background: status === s ? "#1E293B" : "transparent", color: status === s ? "#F1F5F9" : "#64748B", textTransform: "capitalize" }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #1E293B" }}>
                                {["Restaurant", "Owner", "Plan", "Status", "Scans", "Created", "Actions"].map((h) => (
                                    <th key={h} style={{ padding: "12px 16px", fontSize: 11.5, fontWeight: 700, color: "#475569", textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center" }}>
                                    <div style={{ width: 24, height: 24, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                                </td></tr>
                            ) : restaurants.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: 13 }}>No restaurants found</td></tr>
                            ) : restaurants.map((r) => (
                                <tr key={r.id} style={{ borderBottom: "1px solid #0F172A" }}>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#E2E8F0" }}>{r.name}</div>
                                        {r.slug && <div style={{ fontSize: 11.5, color: "#64748B" }}>/{r.slug}</div>}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ fontSize: 13, color: "#94A3B8" }}>{r.owner_email}</div>
                                        <div style={{ fontSize: 11.5, color: "#64748B" }}>{r.owner_name}</div>
                                    </td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: r.plan_name ? "#34D399" : "#475569" }}>
                                        {r.plan_name ?? "No plan"}
                                    </td>
                                    <td style={{ padding: "12px 16px" }}><Badge status={r.status ?? "active"} /></td>
                                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{(r.total_scans ?? 0).toLocaleString()}</td>
                                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{new Date((r.created_at ?? 0) * 1000).toLocaleDateString()}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <Link href={`/admin/restaurants/${r.id}`} title="View" style={{ padding: "5px", background: "#1E293B", borderRadius: 6, color: "#94A3B8", display: "flex" }}><Eye size={13} /></Link>
                                            {(r.status === "pending" || r.status === "suspended") && (
                                                <button title="Approve" onClick={() => doStatus(r.id, "active")} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(52,211,153,0.12)", borderRadius: 6, color: "#34D399", border: "none", cursor: "pointer" }}><CheckCircle2 size={13} /></button>
                                            )}
                                            {r.status === "pending" && (
                                                <button title="Reject" onClick={() => doStatus(r.id, "suspended", "Rejected during review")} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(248,113,113,0.1)", borderRadius: 6, color: "#F87171", border: "none", cursor: "pointer" }}><XCircle size={13} /></button>
                                            )}
                                            {r.status === "active" && (
                                                <button title="Suspend" onClick={() => doStatus(r.id, "suspended")} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(245,158,11,0.1)", borderRadius: 6, color: "#F59E0B", border: "none", cursor: "pointer" }}><Pause size={13} /></button>
                                            )}
                                            {r.status !== "banned" && (
                                                <button title="Ban" onClick={() => { const reason = prompt("Reason for ban:"); if (reason !== null) doStatus(r.id, "banned", reason); }} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(239,68,68,0.1)", borderRadius: 6, color: "#EF4444", border: "none", cursor: "pointer" }}><Ban size={13} /></button>
                                            )}
                                            {r.status === "banned" && (
                                                <button title="Reactivate" onClick={() => doStatus(r.id, "active")} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(52,211,153,0.1)", borderRadius: 6, color: "#34D399", border: "none", cursor: "pointer" }}><RotateCcw size={13} /></button>
                                            )}
                                            <button title="Delete" onClick={() => doDelete(r.id, r.name)} disabled={actingOn === r.id} style={{ padding: "5px", background: "rgba(239,68,68,0.1)", borderRadius: 6, color: "#EF4444", border: "none", cursor: "pointer" }}><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: 7, color: "#94A3B8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>← Prev</button>
                            <span style={{ fontSize: 12.5, color: "#64748B" }}>Page {page} of {totalPages}</span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: "6px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: 7, color: "#94A3B8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>Next →</button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

export default function AdminRestaurantsPage() {
    return (
        <Suspense fallback={<AdminLayout><div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>Loading…</div></AdminLayout>}>
            <RestaurantsContent />
        </Suspense>
    );
}
