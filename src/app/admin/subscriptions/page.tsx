"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminPlans, apiAdminCreatePlan, apiAdminUpdatePlan, apiAdminDeletePlan, apiAdminSubscriptions } from "@/lib/adminApi";
import { Plus, Trash2, Edit2, CheckCircle2 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

export default function AdminSubscriptionsPage() {
    const [plans, setPlans] = useState<Obj[]>([]);
    const [subs, setSubs] = useState<Obj[]>([]);
    const [tab, setTab] = useState<"plans" | "subscriptions">("plans");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", short_name: "", status: "enabled", base_plan_id: "", price_monthly: "", scan_limit: "10000", table_limit: "20", features: "", duration_type: "months", duration_value: "1" });
    const [editId, setEditId] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const load = async () => {
        setLoading(true);
        const [p, s] = await Promise.all([apiAdminPlans(), apiAdminSubscriptions()]);
        if (p.data) setPlans(p.data.plans as Obj[]);
        if (s.data) setSubs(s.data.subscriptions as Obj[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const savePlan = async () => {
        const data = {
            name: form.name,
            short_name: form.short_name,
            status: form.status,
            base_plan_id: form.base_plan_id || undefined,
            price_monthly: parseFloat(form.price_monthly) || 0,
            scan_limit: parseInt(form.scan_limit) || -1,
            table_limit: parseInt(form.table_limit) || -1,
            features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
            duration_type: form.duration_type,
            duration_value: parseInt(form.duration_value) || 1,
        };
        if (editId) {
            await apiAdminUpdatePlan(editId, data);
        } else {
            await apiAdminCreatePlan(data);
        }
        setCreating(false); setEditId(null);
        setForm({ name: "", short_name: "", status: "enabled", base_plan_id: "", price_monthly: "", scan_limit: "10000", table_limit: "20", features: "", duration_type: "months", duration_value: "1" });
        setSaved(true); setTimeout(() => setSaved(false), 2000);
        load();
    };

    const startEdit = (p: Obj) => {
        setForm({ name: p.name, short_name: p.short_name || "", status: p.status || "enabled", base_plan_id: p.base_plan_id || "", price_monthly: String(p.price_monthly), scan_limit: String(p.scan_limit), table_limit: String(p.table_limit), features: (JSON.parse(p.features || "[]") as string[]).join(", "), duration_type: p.duration_type || "months", duration_value: String(p.duration_value || 1) });
        setEditId(p.id); setCreating(true);
    };

    const inp = (key: keyof typeof form) => ({
        value: form[key],
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
        style: { width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
    });

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ maxWidth: 960 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Subscriptions</div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ display: "flex", background: "#0F1629", border: "1px solid #1E293B", borderRadius: 9, padding: 4, gap: 4 }}>
                            {(["plans", "subscriptions"] as const).map((t) => (
                                <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, fontFamily: "inherit", background: tab === t ? "#1E293B" : "transparent", color: tab === t ? "#F1F5F9" : "#64748B", textTransform: "capitalize" }}>{t}</button>
                            ))}
                        </div>
                        {tab === "plans" && (
                            <button onClick={() => { setCreating(true); setEditId(null); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                <Plus size={14} /> New Plan
                            </button>
                        )}
                    </div>
                </div>

                {creating && (
                    <div style={{ background: "#0F1629", border: "1px solid #334155", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>{editId ? "Edit Plan" : "Create Plan"}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Plan Name</label><input {...inp("name")} placeholder="Pro Plan" /></div>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Short Name</label><input {...inp("short_name")} placeholder="Pro" /></div>
                            <div>
                                <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Status</label>
                                <select {...inp("status")}>
                                    <option value="enabled">Enabled</option>
                                    <option value="unlisted">Unlisted (Hidden)</option>
                                    <option value="disabled">Disabled</option>
                                    <option value="coming_soon">Coming Soon</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Base Plan (Inherit Features)</label>
                                <select {...inp("base_plan_id")}>
                                    <option value="">None (Standalone Plan)</option>
                                    {plans.filter(p => p.id !== editId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Price / Month ($)</label><input {...inp("price_monthly")} type="number" placeholder="29.99" /></div>
                            <div>
                                <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Duration Unit</label>
                                <select {...inp("duration_type")}>
                                    <option value="minutes">Minutes</option>
                                    <option value="days">Days</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                </select>
                            </div>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Duration Value</label><input {...inp("duration_value")} type="number" min="1" /></div>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Scan Limit (-1 for Unlimited)</label><input {...inp("scan_limit")} type="number" /></div>
                            <div><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Table Limit (-1 for Unlimited)</label><input {...inp("table_limit")} type="number" /></div>
                            <div style={{ gridColumn: "1/-1" }}><label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>Features (comma-separated)</label><input {...inp("features")} placeholder="QR codes, Analytics, Priority support" /></div>
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                            <button onClick={savePlan} style={{ padding: "8px 18px", background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                                {saved ? <><CheckCircle2 size={13} /> Saved!</> : "Save Plan"}
                            </button>
                            <button onClick={() => { setCreating(false); setEditId(null); }} style={{ padding: "8px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 24, height: 24, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    </div>
                ) : tab === "plans" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                        {plans.map((p) => (
                            <div key={p.id} style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, padding: "18px 20px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>{p.name}</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color: "#34D399", marginTop: 4 }}>${p.price_monthly}<span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>/mo</span></div>
                                    </div>
                                    <div style={{ display: "flex", gap: 4 }}>
                                        <button onClick={() => startEdit(p)} style={{ padding: 6, background: "#1E293B", border: "none", borderRadius: 7, color: "#94A3B8", cursor: "pointer" }}><Edit2 size={12} /></button>
                                        <button onClick={async () => { if (confirm(`Delete plan "${p.name}"?`)) { await apiAdminDeletePlan(p.id); load(); } }} style={{ padding: 6, background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 7, color: "#EF4444", cursor: "pointer" }}><Trash2 size={12} /></button>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: "#64748B", display: "flex", gap: 12 }}>
                                    <span>{(p.scan_limit ?? 0).toLocaleString()} scans</span>
                                    <span>{p.table_limit} tables</span>
                                </div>
                                {JSON.parse(p.features || "[]").length > 0 && (
                                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {(JSON.parse(p.features || "[]") as string[]).map((f: string) => (
                                            <span key={f} style={{ fontSize: 11, background: "#1E293B", color: "#94A3B8", padding: "2px 8px", borderRadius: 20 }}>{f}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #1E293B" }}>
                                    {["Restaurant", "Plan", "Price", "Status", "Started", "Expires"].map((h) => (
                                        <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subs.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>No subscriptions found</td></tr>
                                ) : subs.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: "1px solid #0F172A" }}>
                                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#E2E8F0" }}>{s.restaurant_name}</td>
                                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#34D399" }}>{s.plan_name}</td>
                                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#94A3B8" }}>${s.price_monthly}/mo</td>
                                        <td style={{ padding: "11px 16px" }}>
                                            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.status === "active" ? "#34D399" : "#F87171", background: s.status === "active" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", padding: "3px 10px", borderRadius: 20 }}>{s.status}</span>
                                        </td>
                                        <td style={{ padding: "11px 16px", fontSize: 12, color: "#64748B" }}>{new Date(s.started_at * 1000).toLocaleDateString()}</td>
                                        <td style={{ padding: "11px 16px", fontSize: 12, color: "#64748B" }}>{s.expires_at ? new Date(s.expires_at * 1000).toLocaleDateString() : "Never"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
