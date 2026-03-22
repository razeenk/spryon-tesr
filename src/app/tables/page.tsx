"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { getToken, authHeaders } from "@/lib/api";
import { Armchair } from "lucide-react";
import { toPng } from "html-to-image";
import PrintableQrCard from "@/components/PrintableQrCard";
import { useDashboard } from "@/lib/useDashboard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

interface Table { id: string; label: string; seats: number; qr_token: string; created_at: number; active_sessions: number; total_scans: number; }

function Spinner() {
    return <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function QrPattern() {
    // Pure SVG QR placeholder (no external dependency)
    return (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="22" height="22" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="8" y="8" width="10" height="10" rx="1" fill="#CBD5E1" />
            <rect x="40" y="2" width="22" height="22" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="46" y="8" width="10" height="10" rx="1" fill="#CBD5E1" />
            <rect x="2" y="40" width="22" height="22" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="2" />
            <rect x="8" y="46" width="10" height="10" rx="1" fill="#CBD5E1" />
            <rect x="30" y="2" width="4" height="4" fill="#CBD5E1" />
            <rect x="30" y="10" width="4" height="4" fill="#CBD5E1" />
            <rect x="30" y="18" width="4" height="4" fill="#CBD5E1" />
            <rect x="30" y="30" width="4" height="4" fill="#CBD5E1" />
            <rect x="30" y="38" width="4" height="4" fill="#CBD5E1" />
            <rect x="30" y="46" width="4" height="12" fill="#CBD5E1" />
            <rect x="38" y="30" width="4" height="4" fill="#CBD5E1" />
            <rect x="46" y="30" width="4" height="4" fill="#CBD5E1" />
            <rect x="54" y="30" width="4" height="4" fill="#CBD5E1" />
            <rect x="38" y="38" width="12" height="4" fill="#CBD5E1" />
            <rect x="38" y="46" width="4" height="4" fill="#CBD5E1" />
            <rect x="46" y="50" width="12" height="4" fill="#CBD5E1" />
        </svg>
    );
}

export default function TablesPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const { data } = useDashboard();

    // Add table modal
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ label: "", seats: "2" });
    const [adding, setAdding] = useState(false);
    const [formError, setFormError] = useState("");

    // Edit table modal
    const [editTarget, setEditTarget] = useState<Table | null>(null);
    const [editForm, setEditForm] = useState({ label: "", seats: "2" });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const token = getToken();

    const load = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/tables`, { headers: authHeaders() });
            const data = await res.json() as { ok: boolean; tables: Table[] };
            if (data.ok) setTables(data.tables);
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    const addTable = async () => {
        if (!form.label.trim()) { setFormError("Table label required"); return; }
        setAdding(true); setFormError("");
        const res = await fetch(`${API}/api/tables`, {
            method: "POST",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ label: form.label.trim(), seats: parseInt(form.seats) || 2 }),
        });
        const data = await res.json() as { ok: boolean; error?: string };
        if (data.ok) { setShowAdd(false); setForm({ label: "", seats: "2" }); await load(); }
        else setFormError(data.error ?? "Failed to create table");
        setAdding(false);
    };

    const deleteTable = async (id: string, label: string) => {
        if (!confirm(`Delete ${label}? This will also remove all session history for this table.`)) return;
        setDeleting(id);
        await fetch(`${API}/api/tables/${id}`, { method: "DELETE", headers: authHeaders() });
        setTables((prev) => prev.filter((t) => t.id !== id));
        setDeleting(null);
    };

    const openEdit = (table: Table) => {
        setEditTarget(table);
        setEditForm({ label: table.label, seats: String(table.seats) });
        setEditError("");
    };

    const saveEdit = async () => {
        if (!editTarget) return;
        if (!editForm.label.trim()) { setEditError("Label is required"); return; }
        setEditSaving(true); setEditError("");
        const res = await fetch(`${API}/api/tables/${editTarget.id}`, {
            method: "PATCH",
            headers: authHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ label: editForm.label.trim(), seats: parseInt(editForm.seats) || 2 }),
        });
        const data = await res.json() as { ok: boolean; error?: string };
        if (data.ok) {
            setEditTarget(null);
            await load();
        } else setEditError(data.error ?? "Failed to update table");
        setEditSaving(false);
    };

    const activeCount = tables.filter((t) => t.active_sessions > 0).length;
    const totalScans = tables.reduce((s, t) => s + t.total_scans, 0);

    const origin = data?.platformUrl || (typeof window !== "undefined" ? window.location.origin : "https://spryon.app");
    const menuUrl = (qrToken: string) => `${origin}/menu/${qrToken}`;

    const [downloadingQr, setDownloadingQr] = useState<string | null>(null);
    const [qrData, setQrData] = useState<{ id: string, label: string, url: string } | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const handleDownloadQr = async (table: Table) => {
        setDownloadingQr(table.id);
        const url = menuUrl(table.qr_token);
        setQrData({ id: table.id, label: table.label, url });
        
        // Let React mount the hidden component
        setTimeout(async () => {
            if (qrRef.current) {
                try {
                    const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 2 });
                    const link = document.createElement('a');
                    link.download = `Spryon_Table_${table.label.replace(/[^a-z0-9]/gi, '_')}.png`;
                    link.href = dataUrl;
                    link.click();
                } catch (err) {
                    console.error("Failed to generate QR image", err);
                    alert("Failed to generate high-resolution QR. Please try again.");
                }
            }
            setDownloadingQr(null);
        }, 150);
    };

    return (
        <DashboardLayout title="Tables">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="page-title">Tables & QR Codes</div>
                    <div className="page-subtitle">{tables.length} table{tables.length !== 1 ? "s" : ""} · {activeCount} active now</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add Table
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {[
                    { label: "Total Tables", value: tables.length.toString(), sub: "All configured" },
                    { label: "Active Now", value: activeCount.toString(), sub: "Guests browsing" },
                    { label: "Total Scans", value: totalScans.toString(), sub: "Across all tables" },
                ].map((s, i) => (
                    <div key={i} className="card stat">
                        <div className="stat-header"><span className="stat-label">{s.label}</span></div>
                        <div className="stat-value">{loading ? "—" : s.value}</div>
                        <div className="stat-delta">{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Tables grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="card" style={{ padding: "18px", height: "180px", animation: "pulse 1.5s ease-in-out infinite" }} />
                    ))}
                </div>
            ) : tables.length === 0 ? (
                <div className="card" style={{ padding: "48px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}><Armchair size={36} color="#D1D5DB" /></div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>No tables yet</div>
                    <div style={{ fontSize: "13.5px", color: "var(--muted)", marginBottom: "20px" }}>Add your first table to generate a QR code for guests.</div>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>Add your first table</button>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                    {tables.map((table) => {
                        const isActive = table.active_sessions > 0;
                        return (
                            <div key={table.id} className="card" style={{ padding: "18px" }}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                                    <div>
                                        <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{table.label}</div>
                                        <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "2px" }}>{table.seats} seat{table.seats !== 1 ? "s" : ""}</div>
                                    </div>
                                    <span className={`status-badge ${isActive ? "active" : "idle"}`}>
                                        {isActive ? "Active" : "Idle"}
                                    </span>
                                </div>

                                {/* QR preview box */}
                                <div style={{ background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: "10px", height: "100px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "14px" }}>
                                    <QrPattern />
                                    <span style={{ fontSize: "11px", color: "var(--muted-light)" }}>/{table.qr_token.slice(0, 8)}…</span>
                                </div>

                                {/* Footer */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                                        {table.total_scans} scan{table.total_scans !== 1 ? "s" : ""}
                                    </span>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "12px", color: "var(--accent-dark)" }}
                                            onClick={() => handleDownloadQr(table)}
                                            disabled={downloadingQr === table.id}>
                                            {downloadingQr === table.id ? "..." : "Print"}
                                        </button>
                                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "12px" }}
                                            onClick={() => { if (typeof window !== "undefined") { const a = document.createElement("a"); a.href = menuUrl(table.qr_token); a.target = "_blank"; a.rel = "noopener"; a.click(); } }}>
                                            Open
                                        </button>
                                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "12px" }}
                                            onClick={() => openEdit(table)}>
                                            Edit
                                        </button>
                                        <button className="btn-ghost" style={{ padding: "4px 8px", fontSize: "12px", color: "var(--danger)" }}
                                            onClick={() => deleteTable(table.id, table.label)}
                                            disabled={deleting === table.id}>
                                            {deleting === table.id ? "…" : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Table Modal */}
            {showAdd && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "white", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "360px", border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>Add Table</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "6px" }}>Table label *</label>
                                <input className="input" placeholder="e.g. Table 1 or Window Booth" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addTable()} style={{ width: "100%" }} autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "6px" }}>Seats</label>
                                <input className="input" type="number" min="1" max="20" value={form.seats} onChange={(e) => setForm((p) => ({ ...p, seats: e.target.value }))} style={{ width: "100%" }} />
                            </div>
                        </div>
                        {formError && <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--danger)" }}>{formError}</div>}
                        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                            <button className="btn-secondary" onClick={() => { setShowAdd(false); setFormError(""); }} style={{ flex: 1 }}>Cancel</button>
                            <button className="btn-primary" onClick={addTable} disabled={adding} style={{ flex: 1 }}>
                                {adding ? <><Spinner /> Creating…</> : "Create Table"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {editTarget && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ background: "white", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "360px", border: "1px solid var(--border)" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", marginBottom: "20px" }}>Edit Table</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "6px" }}>Table label *</label>
                                <input className="input" value={editForm.label} onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && saveEdit()} style={{ width: "100%" }} autoFocus />
                            </div>
                            <div>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "block", marginBottom: "6px" }}>Seats</label>
                                <input className="input" type="number" min="1" max="20" value={editForm.seats} onChange={(e) => setEditForm((p) => ({ ...p, seats: e.target.value }))} style={{ width: "100%" }} />
                            </div>
                        </div>
                        {editError && <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--danger)" }}>{editError}</div>}
                        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
                            <button className="btn-secondary" onClick={() => setEditTarget(null)} style={{ flex: 1 }}>Cancel</button>
                            <button className="btn-primary" onClick={saveEdit} disabled={editSaving} style={{ flex: 1 }}>
                                {editSaving ? <><Spinner /> Saving…</> : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden render area for QR Code generation (off-screen) */}
            <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
                {qrData && (
                    <PrintableQrCard
                        ref={qrRef}
                        restaurantName={"Table QR"}
                        tableName={qrData.label}
                        url={qrData.url}
                    />
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </DashboardLayout>
    );
}
