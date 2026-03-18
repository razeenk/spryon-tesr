"use client";

import { useDashboard } from "@/lib/useDashboard";

function Skeleton({ width = "100%" }: { width?: string }) {
    return <div style={{ height: "13px", width, background: "#F3F4F6", borderRadius: "5px", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

export default function RecentScans() {
    const { data, loading } = useDashboard();
    const scans = data?.recentScans ?? [];

    return (
        <div className="card" style={{ padding: "20px 0 0" }}>
            <div className="section-header" style={{ padding: "0 20px 14px" }}>
                <h3 className="section-title">Recent Scans</h3>
                <span className="section-action">Live</span>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ paddingLeft: "20px" }}>Table</th>
                        <th>Views</th>
                        <th>Duration</th>
                        <th style={{ paddingRight: "20px" }}>Time</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array(5).fill(0).map((_, i) => (
                            <tr key={i}>
                                <td style={{ paddingLeft: "20px" }}><Skeleton width="70px" /></td>
                                <td><Skeleton width="60px" /></td>
                                <td><Skeleton width="50px" /></td>
                                <td style={{ paddingRight: "20px" }}><Skeleton width="70px" /></td>
                            </tr>
                        ))
                    ) : scans.length === 0 ? (
                        <tr><td colSpan={4} style={{ paddingLeft: "20px", paddingBottom: "20px", color: "var(--muted)", fontSize: "13.5px" }}>No scans yet — share your QR codes to get started.</td></tr>
                    ) : (
                        scans.map((scan) => (
                            <tr key={scan.id}>
                                <td style={{ paddingLeft: "20px", fontWeight: 500 }}>{scan.table}</td>
                                <td style={{ color: "var(--muted)" }}>{scan.itemViews} item{scan.itemViews !== 1 ? "s" : ""} viewed</td>
                                <td style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                                    {scan.active ? (
                                        <span style={{ color: "#34D399", fontWeight: 600, fontSize: "12px" }}>● Live</span>
                                    ) : scan.duration}
                                </td>
                                <td style={{ color: "var(--muted-light)", fontSize: "12.5px", paddingRight: "20px" }}>{scan.timeAgo}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
    );
}
