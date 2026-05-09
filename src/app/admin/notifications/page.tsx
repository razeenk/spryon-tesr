"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Send, Users, MapPin, Target, Loader2, CheckCircle2, History, MessageSquare, Trash2 } from "lucide-react";
import { apiAdminCreateNotification, apiAdminGetNotificationHistory, apiAdminDeleteBroadcast } from "@/lib/adminApi";

export default function AdminNotifications() {
    const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

    // Compose State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [targetAudience, setTargetAudience] = useState<"all" | "location" | "specific">("all");
    const [locationFilter, setLocationFilter] = useState("");
    const [specificUsers, setSpecificUsers] = useState("");
    
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // History State
    const [history, setHistory] = useState<{ broadcast_id: string; title: string; message: string; created_at: number; sent_count: number; read_count: number; }[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
    }, [activeTab]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await apiAdminGetNotificationHistory();
            if (res.data?.history) {
                setHistory(res.data.history);
            }
        } catch {}
        setHistoryLoading(false);
    };

    const handleDeleteBroadcast = async (id: string) => {
        if (!confirm("Are you sure you want to completely delete this notification from every user's inbox?")) return;
        setHistory(prev => prev.filter(h => h.broadcast_id !== id));
        await apiAdminDeleteBroadcast(id);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!title.trim() || !message.trim()) {
            setError("Title and message are required.");
            return;
        }

        if (targetAudience === "location" && !locationFilter.trim()) {
            setError("Please specify a city for targeting by location.");
            return;
        }

        let userList: string[] = [];
        if (targetAudience === "specific") {
            userList = specificUsers.split(",").map(id => id.trim()).filter(Boolean);
            if (userList.length === 0) {
                setError("Please provide at least one valid User ID.");
                return;
            }
        }

        setSending(true);

        try {
            const res = await apiAdminCreateNotification({
                title,
                message,
                targetAudience,
                locationFilter: locationFilter || undefined,
                specificUsers: userList.length > 0 ? userList : undefined
            });

            if (res.data?.ok) {
                setSuccess(`Successfully sent notification to ${res.data.sentCount} user(s).`);
                setTitle("");
                setMessage("");
                setTargetAudience("all");
                setLocationFilter("");
                setSpecificUsers("");
            } else {
                setError(res.error || "Failed to send notification.");
            }
        } catch (err: any) {
            setError("An unexpected error occurred.");
        } finally {
            setSending(false);
        }
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts * 1000);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                        <h1 style={{ color: "#F8FAFC", fontSize: 28, margin: "0 0 8px" }}>Notifications</h1>
                        <p style={{ color: "#94A3B8", margin: 0 }}>Push direct messages and view send history.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 24, padding: 4, background: "#1E293B", borderRadius: 12, width: "fit-content", border: "1px solid #334155" }}>
                    <button
                        onClick={() => setActiveTab("compose")}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
                            border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                            backgroundColor: activeTab === "compose" ? "#3B82F6" : "transparent",
                            color: activeTab === "compose" ? "#FFFFFF" : "#94A3B8"
                        }}
                    >
                        <MessageSquare size={16} /> Compose
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8,
                            border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                            backgroundColor: activeTab === "history" ? "#3B82F6" : "transparent",
                            color: activeTab === "history" ? "#FFFFFF" : "#94A3B8"
                        }}
                    >
                        <History size={16} /> History
                    </button>
                </div>

                {activeTab === "compose" && (
                    <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, overflow: "hidden", animation: "fadeIn 0.2s ease-out" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Send size={20} color="#3B82F6" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F1F5F9", margin: 0 }}>Compose Message</h2>
                                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Write and target your notification</div>
                            </div>
                        </div>

                        <form onSubmit={handleSend} style={{ padding: 24 }}>
                            {success && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34D399", padding: "12px 16px", borderRadius: 8, marginBottom: 24 }}>
                                    <CheckCircle2 size={18} />
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{success}</div>
                                </div>
                            )}
                            
                            {error && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#F87171", padding: "12px 16px", borderRadius: 8, marginBottom: 24 }}>
                                    <div style={{ fontSize: 14, fontWeight: 500 }}>{error}</div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
                                <div style={{ flex: "1 1 calc(50% - 12px)", minWidth: 280 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>Title <span style={{ color: "#EF4444" }}>*</span></label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g., System Maintenance Update"
                                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "12px 16px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                        required
                                    />
                                </div>

                                <div style={{ flex: "1 1 100%", minWidth: 280 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>Message <span style={{ color: "#EF4444" }}>*</span></label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        placeholder="Write your message here..."
                                        style={{ width: "100%", background: "#0F172A", border: "1px solid #334155", color: "#F8FAFC", padding: "12px 16px", borderRadius: 8, fontSize: 14, outline: "none", minHeight: 120, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ height: 1, background: "#334155", margin: "24px -24px" }} />

                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", margin: "0 0 16px 0" }}>Target Audience</h3>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        onClick={() => setTargetAudience("all")}
                                        style={{
                                            flex: 1, minWidth: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                            padding: 16, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                                            background: targetAudience === "all" ? "rgba(59, 130, 246, 0.1)" : "#0F172A",
                                            border: targetAudience === "all" ? "1px solid #3B82F6" : "1px solid #334155",
                                            color: targetAudience === "all" ? "#60A5FA" : "#94A3B8"
                                        }}
                                    >
                                        <Users size={24} />
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>All Admins</div>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setTargetAudience("location")}
                                        style={{
                                            flex: 1, minWidth: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                            padding: 16, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                                            background: targetAudience === "location" ? "rgba(16, 185, 129, 0.1)" : "#0F172A",
                                            border: targetAudience === "location" ? "1px solid #10B981" : "1px solid #334155",
                                            color: targetAudience === "location" ? "#34D399" : "#94A3B8"
                                        }}
                                    >
                                        <MapPin size={24} />
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>By City</div>
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setTargetAudience("specific")}
                                        style={{
                                            flex: 1, minWidth: 140, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                                            padding: 16, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                                            background: targetAudience === "specific" ? "rgba(168, 85, 247, 0.1)" : "#0F172A",
                                            border: targetAudience === "specific" ? "1px solid #A855F7" : "1px solid #334155",
                                            color: targetAudience === "specific" ? "#C084FC" : "#94A3B8"
                                        }}
                                    >
                                        <Target size={24} />
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>Specific Users</div>
                                    </button>
                                </div>
                            </div>

                            {targetAudience === "location" && (
                                <div style={{ marginBottom: 24, animation: "fadeIn 0.2s ease-out" }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>City Name</label>
                                    <input
                                        value={locationFilter}
                                        onChange={e => setLocationFilter(e.target.value)}
                                        placeholder="e.g., New York"
                                        style={{ width: "100%", background: "#0F172A", border: "1px solid #10B981", color: "#F8FAFC", padding: "12px 16px", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                                    />
                                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 6 }}>Will target any restaurant whose city contains this text.</div>
                                </div>
                            )}

                            {targetAudience === "specific" && (
                                <div style={{ marginBottom: 24, animation: "fadeIn 0.2s ease-out" }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 8 }}>User IDs (comma separated)</label>
                                    <textarea
                                        value={specificUsers}
                                        onChange={e => setSpecificUsers(e.target.value)}
                                        placeholder="e.g., 362ecc3b-69be-415c-89f0-c4c9b99e0c68, 281a9a5e-2239..."
                                        style={{ width: "100%", background: "#0F172A", border: "1px solid #A855F7", color: "#F8FAFC", padding: "12px 16px", borderRadius: 8, fontSize: 14, outline: "none", minHeight: 80, boxSizing: "border-box", resize: "vertical", fontFamily: "monospace" }}
                                    />
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: sending ? "#1E3A8A" : "#2563EB", color: "white", padding: "12px 24px",
                                        borderRadius: 8, fontWeight: 600, fontSize: 14, border: "none", cursor: sending ? "not-allowed" : "pointer",
                                        transition: "background 0.2s",
                                    }}
                                >
                                    {sending ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Sending...</> : "Send Notification"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === "history" && (
                    <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: 16, overflow: "hidden", animation: "fadeIn 0.2s ease-out" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid #334155" }}>
                            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#F1F5F9", margin: 0 }}>Sent History</h2>
                            <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Note: Older messages are automatically deleted after 7 days.</div>
                        </div>

                        {historyLoading ? (
                            <div style={{ padding: 48, textAlign: "center", color: "#94A3B8", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
                                Loading history...
                            </div>
                        ) : history.length === 0 ? (
                            <div style={{ padding: 48, textAlign: "center", color: "#64748B" }}>
                                <History size={48} style={{ margin: "0 auto 16px", opacity: 0.2 }} />
                                <div style={{ fontSize: 15, fontWeight: 500, color: "#94A3B8" }}>No active history</div>
                                <div style={{ fontSize: 14, marginTop: 4 }}>Sent notifications will appear here for 7 days.</div>
                            </div>
                        ) : (
                            <div>
                                {history.map((h, i) => (
                                    <div key={h.broadcast_id || i} style={{ padding: "20px 24px", borderBottom: i === history.length - 1 ? "none" : "1px solid #334155", display: "flex", gap: 16, alignItems: "flex-start", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#0F172A"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: "#F8FAFC" }}>{h.title}</div>
                                                <div style={{ fontSize: 12, color: "#64748B" }}>{formatDate(h.created_at)}</div>
                                            </div>
                                            <div style={{ fontSize: 14, color: "#94A3B8", lineHeight: 1.5, marginBottom: 12 }}>
                                                {h.message}
                                            </div>
                                            <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B" }}>
                                                    <Users size={14} /> Sent to: <strong style={{ color: "#E2E8F0" }}>{h.sent_count}</strong>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748B" }}>
                                                    <CheckCircle2 size={14} color={h.read_count > 0 ? "#10B981" : "inherit"} /> Read by: <strong style={{ color: h.read_count > 0 ? "#34D399" : "#E2E8F0" }}>{h.read_count}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            title="Delete everywhere"
                                            onClick={() => handleDeleteBroadcast(h.broadcast_id)}
                                            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EF4444"; e.currentTarget.style.color = "white"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#EF4444"; }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </AdminLayout>
    );
}
