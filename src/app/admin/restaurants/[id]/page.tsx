"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminGetRestaurant, apiAdminUpdateRestaurantStatus, apiAdminPlans, apiAdminAssignPlan } from "@/lib/adminApi";
import { ArrowLeft, CheckCircle2, XCircle, Pause, Ban, RotateCcw, CreditCard } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#34D399", bg: "rgba(52,211,153,0.12)" },
    pending: { label: "Pending", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    suspended: { label: "Suspended", color: "#F87171", bg: "rgba(248,113,113,0.12)" },
    banned: { label: "Banned", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1E293B" }}>
            <span style={{ fontSize: 12.5, color: "#64748B", fontWeight: 600 }}>{label}</span>
            <span style={{ fontSize: 13, color: "#E2E8F0" }}>{value ?? "—"}</span>
        </div>
    );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1E293B", fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>{title}</div>
            <div style={{ padding: "4px 20px 16px" }}>{children}</div>
        </div>
    );
}

export default function AdminRestaurantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [data, setData] = useState<{ restaurant: Obj; recentSessions: Obj[] } | null>(null);
    const [plans, setPlans] = useState<Obj[]>([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    const load = async () => {
        const [r, p] = await Promise.all([apiAdminGetRestaurant(id), apiAdminPlans()]);
        if (r.data) setData(r.data as { restaurant: Obj; recentSessions: Obj[] });
        if (p.data) setPlans(p.data.plans as Obj[]);
        setLoading(false);
    };

    useEffect(() => { load(); }, [id]);

    const doStatus = async (status: string, reason?: string) => {
        setActing(true);
        await apiAdminUpdateRestaurantStatus(id, status, reason);
        setActing(false);
        load();
    };

    const assignPlan = async () => {
        const planId = prompt("Enter Plan ID to assign:");
        if (!planId) return;
        await apiAdminAssignPlan(id, planId);
        load();
    };

    if (loading) {
        return (
            <AdminLayout>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                    <div style={{ width: 28, height: 28, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                </div>
            </AdminLayout>
        );
    }

    if (!data) {
        return <AdminLayout><div style={{ color: "#F87171", padding: 40 }}>Restaurant not found</div></AdminLayout>;
    }

    const r = data.restaurant;
    const status = r.status ?? "active";
    const badge = STATUS_MAP[status] ?? { label: status, color: "#94A3B8", bg: "#1E293B" };

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <div style={{ maxWidth: 960 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                    <Link href="/admin/restaurants" style={{ color: "#64748B", display: "flex" }}><ArrowLeft size={18} /></Link>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>{r.name}</div>
                        <div style={{ fontSize: 13, color: "#64748B" }}>{r.slug ? `spryon.com/${r.slug}` : "No slug set"}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: badge.color, background: badge.bg, padding: "4px 14px", borderRadius: 20 }}>{badge.label}</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {(status === "pending" || status === "suspended") && (
                        <button onClick={() => doStatus("active")} disabled={acting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 9, color: "#34D399", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <CheckCircle2 size={14} /> Approve
                        </button>
                    )}
                    {status === "pending" && (
                        <button onClick={() => doStatus("suspended", "Rejected during review")} disabled={acting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 9, color: "#F87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <XCircle size={14} /> Reject
                        </button>
                    )}
                    {status === "active" && (
                        <button onClick={() => doStatus("suspended")} disabled={acting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 9, color: "#F59E0B", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <Pause size={14} /> Suspend
                        </button>
                    )}
                    {status !== "banned" && (
                        <button onClick={() => { const reason = prompt("Reason for ban:"); if (reason !== null) doStatus("banned", reason); }} disabled={acting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <Ban size={14} /> Ban
                        </button>
                    )}
                    {status === "banned" && (
                        <button onClick={() => doStatus("active")} disabled={acting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 9, color: "#34D399", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            <RotateCcw size={14} /> Reactivate
                        </button>
                    )}
                    <button onClick={assignPlan} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        <CreditCard size={14} /> Assign Plan
                    </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Owner Info */}
                    <Card title="Owner Information">
                        <InfoRow label="Name" value={r.owner_name} />
                        <InfoRow label="Email" value={r.owner_email} />
                        <InfoRow label="Phone" value={r.owner_phone} />
                    </Card>

                    {/* Restaurant Details */}
                    <Card title="Restaurant Details">
                        <InfoRow label="Name" value={r.name} />
                        <InfoRow label="Slug" value={r.slug} />
                        <InfoRow label="Email" value={r.email} />
                        <InfoRow label="Phone" value={r.phone} />
                        <InfoRow label="Address" value={r.address} />
                        <InfoRow label="Currency" value={r.currency} />
                        <InfoRow label="Timezone" value={r.timezone} />
                        <InfoRow label="Created" value={new Date((r.created_at ?? 0) * 1000).toLocaleDateString()} />
                    </Card>

                    {/* Stats */}
                    <Card title="Menu Statistics">
                        <InfoRow label="Total Scans" value={(r.total_scans ?? 0).toLocaleString()} />
                        <InfoRow label="Scans Today" value={(r.scans_today ?? 0).toLocaleString()} />
                        <InfoRow label="Menu Items" value={r.menu_items_count} />
                        <InfoRow label="Tables" value={r.tables_count} />
                    </Card>

                    {/* Subscription */}
                    <Card title="Subscription">
                        <InfoRow label="Current Plan" value={r.plan_name ?? "None"} />
                        {r.rejection_reason && <InfoRow label="Restriction Reason" value={r.rejection_reason} />}
                    </Card>
                </div>

                {/* Recent Sessions */}
                {data.recentSessions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <Card title="Recent Table Sessions">
                            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 4 }}>
                                <thead>
                                    <tr>
                                        {["Table", "Started", "Duration", "Item Views"].map((h) => (
                                            <th key={h} style={{ padding: "8px 0", fontSize: 11, color: "#475569", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentSessions.map((s) => (
                                        <tr key={s.id}>
                                            <td style={{ padding: "9px 0", fontSize: 13, color: "#94A3B8", borderTop: "1px solid #1E293B" }}>{s.table_label}</td>
                                            <td style={{ padding: "9px 0", fontSize: 12, color: "#64748B", borderTop: "1px solid #1E293B" }}>{new Date(s.started_at * 1000).toLocaleString()}</td>
                                            <td style={{ padding: "9px 0", fontSize: 12, color: "#64748B", borderTop: "1px solid #1E293B" }}>{s.ended_at ? `${Math.round((s.ended_at - s.started_at) / 60)}m` : "Active"}</td>
                                            <td style={{ padding: "9px 0", fontSize: 13, color: "#E2E8F0", borderTop: "1px solid #1E293B" }}>{s.item_views}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
