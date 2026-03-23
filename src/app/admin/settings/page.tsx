"use client";

import { useState, useEffect } from "react";
import { apiAdminGetSettings, apiAdminUpdateSettings, apiAdminUploadImage } from "@/lib/adminApi";
import { Settings, Save, CheckCircle2, AlertCircle, Upload } from "lucide-react";

function ImageSetupField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
    const [uploading, setUploading] = useState(false);
    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await apiAdminUploadImage(file);
            if (res.ok && res.url) onChange(res.url);
            else alert(res.error || "Upload failed");
        } catch (err) {
            alert("Network error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>{label}</label>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {value ? (
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: "#0F172A", border: "1px solid #334155", overflow: "hidden", flexShrink: 0 }}>
                        <img src={value.startsWith("http") ? value : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787"}${value}`} alt="preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 8, background: "#0F172A", border: "1px dashed #334155", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Upload size={20} color="#64748B" />
                    </div>
                )}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input
                            type="url"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            style={{ flex: 1, padding: "10px 14px", background: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "white", fontSize: 13, outline: "none" }}
                            onFocus={(e) => e.target.style.borderColor = "#34D399"} onBlur={(e) => e.target.style.borderColor = "#334155"}
                        />
                        <label style={{
                            cursor: uploading ? "not-allowed" : "pointer", padding: "10px 16px", background: "#334155", color: "white",
                            borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", opacity: uploading ? 0.7 : 1
                        }}>
                            {uploading ? "Uploading..." : "Upload File"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
                        </label>
                    </div>
                    {value && <button onClick={() => onChange("")} style={{ alignSelf: "flex-start", fontSize: 12, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove image</button>}
                </div>
            </div>
        </div>
    );
}

export default function AdminSettingsPage() {
    const [url, setUrl] = useState("");
    const [globalTitle, setGlobalTitle] = useState("");
    const [globalDescription, setGlobalDescription] = useState("");
    const [globalLogoUrl, setGlobalLogoUrl] = useState("");
    const [globalFaviconUrl, setGlobalFaviconUrl] = useState("");
    const [globalOgImageUrl, setGlobalOgImageUrl] = useState("");
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

    useEffect(() => {
        apiAdminGetSettings().then((res) => {
            if (res.data) {
                setUrl(res.data.website_url);
                setGlobalTitle(res.data.global_title || "");
                setGlobalDescription(res.data.global_description || "");
                setGlobalLogoUrl(res.data.global_logo_url || "");
                setGlobalFaviconUrl(res.data.global_favicon_url || "");
                setGlobalOgImageUrl(res.data.global_og_image_url || "");
            }
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
            const res = await apiAdminUpdateSettings({
                website_url: url,
                global_title: globalTitle || undefined,
                global_description: globalDescription || undefined,
                global_logo_url: globalLogoUrl || undefined,
                global_favicon_url: globalFaviconUrl || undefined,
                global_og_image_url: globalOgImageUrl || undefined,
            });
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

                    <div style={{ marginTop: 24, borderTop: "1px solid #334155", paddingTop: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "white", margin: "0 0 16px" }}>Global SEO Fallbacks</h3>
                        <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>Used for metadata tags when a specific restaurant config doesn't have its own defined.</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>Global Page Title</label>
                                <input
                                    type="text"
                                    value={globalTitle}
                                    onChange={(e) => setGlobalTitle(e.target.value)}
                                    placeholder="Spryon — Digital Menus"
                                    style={{ width: "100%", padding: "12px 16px", background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "white", fontSize: 14, outline: "none" }}
                                    onFocus={(e) => e.target.style.borderColor = "#34D399"} onBlur={(e) => e.target.style.borderColor = "#334155"}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>Global Description</label>
                                <textarea
                                    value={globalDescription}
                                    onChange={(e) => setGlobalDescription(e.target.value)}
                                    placeholder="The best digital menus for your restaurant..."
                                    style={{ width: "100%", padding: "12px 16px", background: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "white", fontSize: 14, outline: "none", resize: "vertical", minHeight: 80 }}
                                    onFocus={(e) => e.target.style.borderColor = "#34D399"} onBlur={(e) => e.target.style.borderColor = "#334155"}
                                />
                            </div>
                            <ImageSetupField label="Global Logo URL" value={globalLogoUrl} onChange={setGlobalLogoUrl} placeholder="Upload or enter logo URL" />
                            <ImageSetupField label="Global Favicon URL" value={globalFaviconUrl} onChange={setGlobalFaviconUrl} placeholder="Upload or enter favicon URL" />
                            <ImageSetupField label="Global OG Image URL" value={globalOgImageUrl} onChange={setGlobalOgImageUrl} placeholder="Upload or enter OG Image URL (1200x630)" />
                        </div>
                    </div>

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
