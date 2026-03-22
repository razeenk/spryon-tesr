"use client";

import { useState, useEffect } from "react";
import { apiAdminGetSettings, apiAdminUpdateSettings } from "@/lib/adminApi";
import { Settings, Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminSettingsPage() {
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    useEffect(() => {
        apiAdminGetSettings().then((res) => {
            if (res.data) setUrl(res.data.website_url);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        if (!url.trim() || !url.startsWith("http")) {
            setMessage({ text: "Please enter a valid URL starting with http:// or https://", type: "error" });
            return;
        }

        setSaving(true);
        setMessage(null);
        
        try {
            const res = await apiAdminUpdateSettings(url);
            if (res.error) {
                setMessage({ text: res.error, type: "error" });
            } else {
                setMessage({ text: "Settings saved successfully", type: "success" });
            }
        } catch (e) {
            setMessage({ text: "Network error saving settings", type: "error" });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 40, color: "#94A3B8", display: "flex", gap: 10 }}>
                <div style={{ width: 20, height: 20, border: "2px solid #334155", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Loading settings...
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 24px" }}>Platform Settings</h1>

            <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: "rgba(52,211,153,0.1)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Settings size={18} color="#34D399" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: 0 }}>Global Website URL</h2>
                        <p style={{ fontSize: 13, color: "#94A3B8", margin: "4px 0 0" }}>This URL is used as the base domain for all automatically generated links and QR codes.</p>
                    </div>
                </div>

                <div style={{ padding: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>Master URL</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://spryon.app"
                        style={{
                            width: "100%", padding: "12px 16px", background: "#0F172A",
                            border: "1px solid #334155", borderRadius: 10, color: "white",
                            fontSize: 14, outline: "none", transition: "border 0.2s"
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#34D399"}
                        onBlur={(e) => e.target.style.borderColor = "#334155"}
                    />
                    <p style={{ fontSize: 12, color: "#64748B", margin: "8px 0 0" }}>
                        Example: <span style={{ color: "#94A3B8" }}>https://mycompany.com</span>
                    </p>

                    {message && (
                        <div style={{
                            marginTop: 20, padding: 12, borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                            background: message.type === "success" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                            color: message.type === "success" ? "#34D399" : "#F87171",
                            border: `1px solid ${message.type === "success" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`
                        }}>
                            {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            {message.text}
                        </div>
                    )}

                    <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                display: "flex", alignItems: "center", gap: 8, padding: "10px 24px",
                                background: "#34D399", color: "#064E3B", border: "none", borderRadius: 10,
                                fontSize: 14, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                                opacity: saving ? 0.7 : 1, transition: "opacity 0.2s"
                            }}
                        >
                            <Save size={16} /> {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
