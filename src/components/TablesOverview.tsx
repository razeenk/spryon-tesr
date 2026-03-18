"use client";

import { useDashboard } from "@/lib/useDashboard";
import Link from "next/link";

function Skeleton() {
    return <div style={{ height: "13px", background: "#F3F4F6", borderRadius: "5px", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

export default function TablesOverview() {
    const { data, loading } = useDashboard();
    const tables = data?.tables ?? [];
    const activeCount = tables.filter((t) => t.status === "active").length;
    const idleCount = tables.length - activeCount;

    return (
        <div className="card" style={{ padding: "20px" }}>
            <div className="section-header">
                <h3 className="section-title">Tables Overview</h3>
                <Link href="/tables" style={{ fontSize: "12.5px", color: "var(--accent-dark)", fontWeight: 500, textDecoration: "none" }}>Manage</Link>
            </div>

            {/* Summary row */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                <div style={{ flex: 1, background: "var(--accent-soft)", borderRadius: "10px", padding: "10px 14px" }}>
                    {loading ? <Skeleton /> : <>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent-dark)", letterSpacing: "-0.5px" }}>{activeCount}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--accent-dark)", opacity: 0.75, marginTop: "1px" }}>Active</div>
                    </>}
                </div>
                <div style={{ flex: 1, background: "#F3F4F6", borderRadius: "10px", padding: "10px 14px" }}>
                    {loading ? <Skeleton /> : <>
                        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.5px" }}>{idleCount}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: "1px" }}>Idle</div>
                    </>}
                </div>
            </div>

            {/* Table list */}
            <div>
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="table-row-item">
                            <Skeleton /> <div style={{ width: "50px" }}><Skeleton /></div>
                        </div>
                    ))
                ) : tables.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)", fontSize: "13.5px" }}>
                        No tables yet.{" "}
                        <Link href="/tables" style={{ color: "var(--accent-dark)", fontWeight: 600, textDecoration: "none" }}>Add your first table →</Link>
                    </div>
                ) : (
                    tables.map((table) => (
                        <div key={table.id} className="table-row-item">
                            <div>
                                <div className="table-row-name">{table.label}</div>
                                <div className="table-row-sub">{table.seats} seat{table.seats !== 1 ? "s" : ""}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {table.scans > 0 && (
                                    <span style={{ fontSize: "12px", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                                        {table.scans} scan{table.scans !== 1 ? "s" : ""}
                                    </span>
                                )}
                                <span className={`status-badge ${table.status}`}>
                                    {table.status === "active" ? "Active" : "Idle"}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
    );
}
