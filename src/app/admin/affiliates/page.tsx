"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminAffiliates, apiAdminCreateAffiliate, apiAdminUpdateAffiliate, apiAdminAffiliateReferrals } from "@/lib/adminApi";
import { Plus, ExternalLink, Pause, CheckCircle2, Copy, Check } from "lucide-react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://spryon.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Obj = Record<string, any>;

export default function AdminAffiliatesPage() {
    const [affiliates, setAffiliates] = useState<Obj[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", commission_pct: "20" });
    const [expanded, setExpanded] = useState<string | null>(null);
    const [referrals, setReferrals] = useState<Record<string, Obj[]>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const res = await apiAdminAffiliates();
        if (res.data) setAffiliates(res.data.affiliates as Obj[]);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const create = async () => {
        setSaving(true);
        const res = await apiAdminCreateAffiliate({ name: form.name, email: form.email, commission_pct: parseFloat(form.commission_pct) || 20 });
        setSaving(false);
        if (!res.error) { setSaved(true); setTimeout(() => setSaved(false), 2000); setCreating(false); setForm({ name: "", email: "", commission_pct: "20" }); load(); }
    };

    const toggleExpand = async (id: string) => {
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        if (!referrals[id]) {
            const res = await apiAdminAffiliateReferrals(id);
            if (res.data) setReferrals((r) => ({ ...r, [id]: res.data!.referrals as Obj[] }));
        }
    };

    const copyUrl = (code: string, id: string) => {
        const url = `${SITE_URL}/register?ref=${code}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const updateStatus = async (id: string, status: string) => {
        await apiAdminUpdateAffiliate(id, { status });
        load();
    };

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ maxWidth: 960 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Affiliates</div>
                        <div style={{ fontSize: 13, color: "#64748B" }}>{affiliates.length} affiliate partners</div>
                    </div>
                    <button onClick={() => setCreating(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        <Plus size={14} /> Add Affiliate
                    </button>
                </div>

                {/* Create form */}
                {creating && (
                    <div style={{ background: "#0F1629", border: "1px solid #334155", borderRadius: 14, padding: 20, marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 16 }}>New Affiliate Partner</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 150px", gap: 12, marginBottom: 14 }}>
                            {[{ label: "Full Name", key: "name", placeholder: "Jane Doe" }, { label: "Email", key: "email", placeholder: "jane@example.com" }, { label: "Commission %", key: "commission_pct", placeholder: "20" }].map(({ label, key, placeholder }) => (
                                <div key={key}>
                                    <label style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600, display: "block", marginBottom: 5 }}>{label}</label>
                                    <input
                                        value={form[key as keyof typeof form]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={create} disabled={saving} style={{ padding: "8px 18px", background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 9, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                {saved ? "✓ Created!" : saving ? "Creating…" : "Create Affiliate"}
                            </button>
                            <button onClick={() => setCreating(false)} style={{ padding: "8px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, color: "#94A3B8", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 24, height: 24, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    </div>
                ) : affiliates.length === 0 ? (
                    <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, padding: "48px 20px", textAlign: "center", color: "#475569", fontSize: 13 }}>
                        No affiliates yet. Add your first partner.
                    </div>
                ) : affiliates.map((a) => (
                    <div key={a.id} style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{a.name}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: a.status === "active" ? "#34D399" : "#F87171", background: a.status === "active" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", padding: "2px 9px", borderRadius: 20 }}>{a.status}</span>
                                </div>
                                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{a.email}</div>
                                {/* Referral URL with copy button */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, background: "#0A0F1E", border: "1px solid #1E293B", borderRadius: 8, padding: "5px 10px", width: "fit-content", maxWidth: "100%" }}>
                                    <span style={{ fontSize: 11, color: "#64748B", flexShrink: 0 }}>🔗</span>
                                    <code style={{ fontSize: 11, color: "#34D399", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                        {SITE_URL}/register?ref={a.referral_code}
                                    </code>
                                    <button
                                        onClick={() => copyUrl(a.referral_code, a.id)}
                                        title="Copy referral link"
                                        style={{ background: "none", border: "none", cursor: "pointer", color: copiedId === a.id ? "#34D399" : "#64748B", padding: 0, display: "flex", flexShrink: 0 }}
                                    >
                                        {copiedId === a.id ? <Check size={12} /> : <Copy size={12} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ textAlign: "right", marginRight: 8 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>{a.commission_pct}%</div>
                                <div style={{ fontSize: 11.5, color: "#64748B" }}>commission</div>
                            </div>
                            <div style={{ textAlign: "right", marginRight: 8 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#F1F5F9" }}>{a.total_referrals}</div>
                                <div style={{ fontSize: 11.5, color: "#64748B" }}>referrals</div>
                            </div>
                            <div style={{ textAlign: "right", marginRight: 8 }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#34D399" }}>${(a.total_earnings ?? 0).toFixed(2)}</div>
                                <div style={{ fontSize: 11.5, color: "#64748B" }}>earned</div>
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                                {a.status === "active" ? (
                                    <button title="Suspend" onClick={() => updateStatus(a.id, "suspended")} style={{ padding: "6px", background: "rgba(245,158,11,0.1)", border: "none", borderRadius: 7, color: "#F59E0B", cursor: "pointer" }}><Pause size={13} /></button>
                                ) : (
                                    <button title="Activate" onClick={() => updateStatus(a.id, "active")} style={{ padding: "6px", background: "rgba(52,211,153,0.1)", border: "none", borderRadius: 7, color: "#34D399", cursor: "pointer" }}><CheckCircle2 size={13} /></button>
                                )}
                                <button title="View referrals" onClick={() => toggleExpand(a.id)} style={{ padding: "6px", background: "#1E293B", border: "none", borderRadius: 7, color: "#94A3B8", cursor: "pointer" }}><ExternalLink size={13} /></button>
                            </div>
                        </div>

                        {expanded === a.id && (
                            <div style={{ borderTop: "1px solid #1E293B", padding: "12px 20px" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Referrals</div>
                                {!referrals[a.id] ? (
                                    <div style={{ color: "#475569", fontSize: 12 }}>Loading…</div>
                                ) : referrals[a.id].length === 0 ? (
                                    <div style={{ color: "#475569", fontSize: 12 }}>No referrals yet</div>
                                ) : (
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead><tr>
                                            {["Restaurant", "Status", "Signup", "Revenue", "Commission"].map((h) => (
                                                <th key={h} style={{ fontSize: 10.5, color: "#475569", textAlign: "left", padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                                            ))}
                                        </tr></thead>
                                        <tbody>
                                            {referrals[a.id].map((ref) => (
                                                <tr key={ref.id}>
                                                    <td style={{ padding: "7px 0", fontSize: 12.5, color: "#E2E8F0", borderTop: "1px solid #1E293B" }}>{ref.restaurant_name}</td>
                                                    <td style={{ padding: "7px 0", borderTop: "1px solid #1E293B" }}><span style={{ fontSize: 11, color: ref.restaurant_status === "active" ? "#34D399" : "#F87171" }}>{ref.restaurant_status}</span></td>
                                                    <td style={{ padding: "7px 0", fontSize: 11.5, color: "#64748B", borderTop: "1px solid #1E293B" }}>{new Date(ref.signup_date * 1000).toLocaleDateString()}</td>
                                                    <td style={{ padding: "7px 0", fontSize: 12.5, color: "#94A3B8", borderTop: "1px solid #1E293B" }}>${ref.revenue.toFixed(2)}</td>
                                                    <td style={{ padding: "7px 0", fontSize: 12.5, color: "#34D399", borderTop: "1px solid #1E293B" }}>${ref.commission.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
