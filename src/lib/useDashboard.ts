"use client";

import { useEffect, useState } from "react";
import { getToken, authHeaders } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

export interface DashboardStats {
    totalScans: number;
    activeSessions: number;
    tableCount: number;
    menuCount: number;
    unavailableItems: number;
}

export interface RecentScan {
    id: string;
    table: string;
    itemViews: number;
    duration: string;
    timeAgo: string;
    active: boolean;
}

export interface TableSummary {
    id: string;
    label: string;
    seats: number;
    status: "active" | "idle";
    scans: number;
}

export interface DashboardData {
    stats: DashboardStats;
    recentScans: RecentScan[];
    tables: TableSummary[];
    restaurant: {
        id: string;
        name: string;
        city: string | null;
        status: 'active' | 'pending' | 'suspended' | 'banned';
        rejection_reason: string | null;
    };
    platformUrl?: string;
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        const token = getToken();
        if (!token) { setError("Not authenticated"); setLoading(false); return; }
        try {
            const res = await fetch(`${API}/api/dashboard`, {
                headers: authHeaders(),
            });
            const json = await res.json() as DashboardData & { ok: boolean; error?: string };
            if (!res.ok || !json.ok) { setError(json.error ?? "Failed to load"); return; }
            setData(json);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Network error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);
    return { data, loading, error, reload: load };
}
