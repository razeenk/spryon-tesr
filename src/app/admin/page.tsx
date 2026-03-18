"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminAnalytics, apiAdminRestaurants } from "@/lib/adminApi";
import {
    Store, Activity, Clock, Ban, ScanLine, TrendingUp, DollarSign,
    Users2, ArrowRight, CheckCircle2
} from "lucide-react";
import Link from "next/link";

interface Stats { totalRestaurants: number; activeRestaurants: number; pendingRestaurants: number; bannedRestaurants: number; totalScans: number; scansToday: number; scansMonth: number; subscriptionRevenue: number; affiliateRevenue: number; }

function StatCard({ label, value, icon, color, bg, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string; sub?: string }) {
    return (
        <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#64748B", marginTop: 3 }}>{label}</div>
            {sub && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [topRest, setTopRest] = useState<Array<{ id: string; name: string; scans: number }>>([]);
    const [pending, setPending] = useState<unknown[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiAdminAnalytics(),
            apiAdminRestaurants({ status: "pending", page: "1" }),
        ]).then(([a, p]) => {
            if (a.data) { setStats(a.data.stats as Stats); setTopRest(a.data.topRestaurants as Array<{ id: string; name: string; scans: number }>); }
            if (p.data) setPending((p.data.restaurants as unknown[]));
            setLoading(false);
        });
    }, []);

    const s = stats;

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <div style={{ maxWidth: 1100 }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>Platform Overview</div>
                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>Real-time insights across all Spryon restaurants</div>
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 28, height: 28, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    </div>
                ) : (
                    <>
                        {/* Stats grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                            <StatCard label="Total Restaurants" value={s?.totalRestaurants ?? 0} icon={<Store size={17} />} color="#60A5FA" bg="rgba(96,165,250,0.12)" />
                            <StatCard label="Active" value={s?.activeRestaurants ?? 0} icon={<Activity size={17} />} color="#34D399" bg="rgba(52,211,153,0.12)" sub="Fully operational" />
                            <StatCard label="Pending Approval" value={s?.pendingRestaurants ?? 0} icon={<Clock size={17} />} color="#F59E0B" bg="rgba(245,158,11,0.12)" sub="Awaiting review" />
                            <StatCard label="Banned" value={s?.bannedRestaurants ?? 0} icon={<Ban size={17} />} color="#F87171" bg="rgba(248,113,113,0.12)" />
                            <StatCard label="Total Scans" value={(s?.totalScans ?? 0).toLocaleString()} icon={<ScanLine size={17} />} color="#A78BFA" bg="rgba(167,139,250,0.12)" />
                            <StatCard label="Scans Today" value={(s?.scansToday ?? 0).toLocaleString()} icon={<TrendingUp size={17} />} color="#34D399" bg="rgba(52,211,153,0.12)" sub={`${(s?.scansMonth ?? 0).toLocaleString()} this month`} />
                            <StatCard label="Sub Revenue" value={`$${(s?.subscriptionRevenue ?? 0).toFixed(2)}`} icon={<DollarSign size={17} />} color="#F59E0B" bg="rgba(245,158,11,0.12)" sub="Active subscriptions" />
                            <StatCard label="Affiliate Revenue" value={`$${(s?.affiliateRevenue ?? 0).toFixed(2)}`} icon={<Users2 size={17} />} color="#EC4899" bg="rgba(236,72,153,0.12)" sub="Commissions paid" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            {/* Pending approvals */}
                            <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>Pending Approvals</div>
                                    <Link href="/admin/restaurants?status=pending" style={{ fontSize: 12, color: "#34D399", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                        View all <ArrowRight size={11} />
                                    </Link>
                                </div>
                                {pending.length === 0 ? (
                                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                                        <CheckCircle2 size={24} color="#34D399" style={{ margin: "0 auto 8px", display: "block" }} />
                                        All caught up! No pending restaurants.
                                    </div>
                                ) : (pending as Array<{ id: string; name: string; owner_email: string; created_at: number }>).slice(0, 5).map((r) => (
                                    <div key={r.id} style={{ padding: "12px 20px", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{r.name}</div>
                                            <div style={{ fontSize: 11.5, color: "#64748B" }}>{r.owner_email}</div>
                                        </div>
                                        <Link href={`/admin/restaurants/${r.id}`} style={{ fontSize: 12, fontWeight: 600, color: "#34D399", textDecoration: "none", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", padding: "4px 12px", borderRadius: 20 }}>
                                            Review
                                        </Link>
                                    </div>
                                ))}
                            </div>

                            {/* Top restaurants */}
                            <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E293B" }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>Top Restaurants by Scans</div>
                                </div>
                                {topRest.length === 0 ? (
                                    <div style={{ padding: "32px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>No scan data yet</div>
                                ) : topRest.slice(0, 5).map((r, i) => (
                                    <div key={r.id} style={{ padding: "12px 20px", borderBottom: "1px solid #0F172A", display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: i === 0 ? "#F59E0B22" : "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: i === 0 ? "#F59E0B" : "#64748B" }}>{i + 1}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{r.name}</div>
                                        </div>
                                        <div style={{ fontSize: 12.5, color: "#94A3B8", fontVariantNumeric: "tabular-nums" }}>{r.scans.toLocaleString()} scans</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
