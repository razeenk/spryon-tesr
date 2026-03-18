"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiAdminAuditLogs } from "@/lib/adminApi";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Log = Record<string, any>;

const ACTION_COLORS: Record<string, string> = {
    admin_login: "#34D399",
    restaurant_active: "#34D399",
    restaurant_pending: "#F59E0B",
    restaurant_suspended: "#F87171",
    restaurant_banned: "#EF4444",
    restaurant_deleted: "#EF4444",
    restaurant_slug_reset: "#60A5FA",
    plan_created: "#A78BFA",
    plan_updated: "#A78BFA",
    plan_deleted: "#F87171",
    plan_assigned: "#34D399",
    affiliate_created: "#EC4899",
    affiliate_updated: "#EC4899",
};

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const load = async (p: number) => {
        setLoading(true);
        const res = await apiAdminAuditLogs(p);
        if (res.data) { setLogs(res.data.logs as Log[]); setTotal(res.data.total); }
        setLoading(false);
    };

    useEffect(() => { load(page); }, [page]);

    const totalPages = Math.ceil(total / 50);

    return (
        <AdminLayout>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ maxWidth: 1000 }}>
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#F1F5F9" }}>Audit Logs</div>
                    <div style={{ fontSize: 13, color: "#64748B" }}>{total.toLocaleString()} total entries — all super admin actions recorded</div>
                </div>

                <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 14, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #1E293B" }}>
                                {["Action", "Admin", "Target", "Detail", "Time"].map((h) => (
                                    <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#475569", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: 48, textAlign: "center" }}>
                                    <div style={{ width: 22, height: 22, border: "2px solid #1E293B", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
                                </td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#475569", fontSize: 13 }}>No audit log entries yet</td></tr>
                            ) : logs.map((log, i) => {
                                const color = ACTION_COLORS[log.action] ?? "#94A3B8";
                                return (
                                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? "1px solid #0F172A" : "none" }}>
                                        <td style={{ padding: "11px 16px" }}>
                                            <span style={{ fontSize: 11.5, fontWeight: 700, color, background: `${color}18`, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
                                                {log.action.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td style={{ padding: "11px 16px", fontSize: 12.5, color: "#94A3B8" }}>{log.admin_email}</td>
                                        <td style={{ padding: "11px 16px" }}>
                                            <div style={{ fontSize: 12, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>{log.target_type}</div>
                                            <div style={{ fontSize: 11, color: "#334155", fontFamily: "monospace" }}>{log.target_id.slice(0, 12)}…</div>
                                        </td>
                                        <td style={{ padding: "11px 16px", fontSize: 12.5, color: "#64748B", maxWidth: 200 }}>
                                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.detail || "—"}</div>
                                        </td>
                                        <td style={{ padding: "11px 16px", fontSize: 11.5, color: "#475569", whiteSpace: "nowrap" }}>
                                            {new Date(log.created_at * 1000).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

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
