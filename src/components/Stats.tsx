"use client";

import { useDashboard } from "@/lib/useDashboard";

const ICONS = {
    scans: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h6V3H3v6zm0 12h6v-6H3v6zm12 0h6v-6h-6v6zm0-18v6h6V3h-6z" /></svg>,
    session: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    table: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>,
    menu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>,
};

function Skeleton() {
    return <div style={{ height: "14px", background: "#F3F4F6", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />;
}

export default function Stats() {
    const { data, loading } = useDashboard();
    const s = data?.stats;

    const cards = [
        { label: "Total Scans", value: s ? s.totalScans.toLocaleString() : "—", delta: "All time views", up: true, icon: ICONS.scans },
        { label: "Active Sessions", value: s ? String(s.activeSessions) : "—", delta: "Right now", up: false, icon: ICONS.session },
        { label: "Tables", value: s ? String(s.tableCount) : "—", delta: s ? `${data?.tables.filter(t => t.status === "active").length ?? 0} active now` : "—", up: false, icon: ICONS.table },
        { label: "Menu Items", value: s ? String(s.menuCount) : "—", delta: s ? (s.unavailableItems > 0 ? `${s.unavailableItems} unavailable` : "All available") : "—", up: false, icon: ICONS.menu },
    ];

    return (
        <div className="stats-grid">
            {cards.map((stat, i) => (
                <div key={i} className="card stat">
                    <div className="stat-header">
                        <span className="stat-label">{stat.label}</span>
                        <div className="stat-icon">{stat.icon}</div>
                    </div>
                    {loading ? (
                        <div style={{ marginTop: "8px" }}><Skeleton /></div>
                    ) : (
                        <>
                            <div className="stat-value">{stat.value}</div>
                            <div className={`stat-delta ${stat.up ? "up" : ""}`}>
                                {stat.up && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>}
                                {stat.delta}
                            </div>
                        </>
                    )}
                </div>
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        </div>
    );
}
