"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminAnalytics } from "@/lib/adminApi";
import { Store, Activity, Clock, Ban, ScanLine, TrendingUp, DollarSign, Users2 } from "lucide-react";

interface Stats { totalRestaurants: number; activeRestaurants: number; pendingRestaurants: number; bannedRestaurants: number; totalScans: number; scansToday: number; scansMonth: number; subscriptionRevenue: number; affiliateRevenue: number; }

function StatCard({ label, value, sub, icon, color, bg }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; bg: string }) {
    return (
        <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 14 }}>{icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-0.5px" }}>{value}</div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#64748B", marginTop: 3 }}>{label}</div>
            {sub && <div style={{ fontSize: 11.5, color: "#475569", marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [topRest, setTopRest] = useState<{ id: string; name: string; scans: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiAdminAnalytics().then((res) => {
            if (res.data) {
                setStats(res.data.stats as Stats);
                setTopRest(res.data.topRestaurants as { id: string; name: string; scans: number }[]);
            }
            setLoading(false);
        });
    }, []);

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ maxWidth: 1100 }}>
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Platform Analytics</div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>Aggregate metrics across all Spryon restaurants</div>
                </div>

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 26, height: 26, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    </div>
                ) : (
                    <>
                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
                            <StatCard label="Total Restaurants" value={stats?.totalRestaurants ?? 0} icon={<Store size={17} />} color="#60A5FA" bg="rgba(96,165,250,0.12)" />
                            <StatCard label="Active" value={stats?.activeRestaurants ?? 0} icon={<Activity size={17} />} color="#34D399" bg="rgba(52,211,153,0.12)" />
                            <StatCard label="Pending" value={stats?.pendingRestaurants ?? 0} icon={<Clock size={17} />} color="#F59E0B" bg="rgba(245,158,11,0.12)" />
                            <StatCard label="Banned" value={stats?.bannedRestaurants ?? 0} icon={<Ban size={17} />} color="#F87171" bg="rgba(248,113,113,0.12)" />
                            <StatCard label="Total Scans" value={(stats?.totalScans ?? 0).toLocaleString()} icon={<ScanLine size={17} />} color="#A78BFA" bg="rgba(167,139,250,0.12)" />
                            <StatCard label="Scans Today" value={(stats?.scansToday ?? 0).toLocaleString()} icon={<TrendingUp size={17} />} color="#34D399" bg="rgba(52,211,153,0.12)" sub={`${(stats?.scansMonth ?? 0).toLocaleString()} this month`} />
                            <StatCard label="Sub Revenue" value={`$${(stats?.subscriptionRevenue ?? 0).toFixed(2)}`} icon={<DollarSign size={17} />} color="#F59E0B" bg="rgba(245,158,11,0.12)" />
                            <StatCard label="Affiliate Revenue" value={`$${(stats?.affiliateRevenue ?? 0).toFixed(2)}`} icon={<Users2 size={17} />} color="#EC4899" bg="rgba(236,72,153,0.12)" />
                        </div>

                        {/* Top restaurants */}
                        <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1E293B", fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>
                                Top Restaurants by Total Scans
                            </div>
                            {topRest.length === 0 ? (
                                <div style={{ padding: "32px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>No scan data yet</div>
                            ) : topRest.map((r, i) => (
                                <div key={r.id} style={{ padding: "12px 20px", borderBottom: i < topRest.length - 1 ? "1px solid #0F172A" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < 3 ? ["rgba(245,158,11,0.15)", "rgba(156,163,175,0.15)", "rgba(180,123,77,0.15)"][i] : "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i < 3 ? ["#F59E0B", "#94A3B8", "#B47B4D"][i] : "#475569", flexShrink: 0 }}>{i + 1}</div>
                                    <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "#E2E8F0" }}>{r.name}</div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: Math.max(40, (r.scans / (topRest[0]?.scans || 1)) * 180), height: 6, background: "linear-gradient(90deg, #34D399, #059669)", borderRadius: 3 }} />
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", fontVariantNumeric: "tabular-nums", minWidth: 70, textAlign: "right" }}>{r.scans.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
