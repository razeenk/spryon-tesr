"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { getToken, clearToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export default function DashboardLayout({
    title,
    subtitle,
    right,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [checking, setChecking] = useState(true);

    // Auth guard — validates token against /auth/me on every mount.
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }
        fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (res.status === 401 || res.status === 403) {
                    clearToken();
                    router.replace("/login");
                } else {
                    setChecking(false);
                }
            })
            .catch(() => { setChecking(false); });
    }, [router]);

    useEffect(() => {
        const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    if (checking) return null;

    return (
        <div className="app">
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="main">
                <Topbar title={title} subtitle={subtitle} right={right} onMenuToggle={() => setSidebarOpen((o) => !o)} />
                <div className="content">{children}</div>
            </div>
        </div>
    );
}
