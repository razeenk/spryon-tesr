"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { apiGetNotifications, apiMarkNotificationRead, apiDeleteNotification, NotificationItem } from "@/lib/api";

export default function NotificationBell({ variant = "topbar" }: { variant?: "topbar" | "sidebar" | "popup-item" }) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Initial fetch and polling
    useEffect(() => {
        let lastCount = 0;
        
        const fetchNotifications = async () => {
            try {
                const res = await apiGetNotifications();
                if (res.data?.ok && res.data.notifications) {
                    const sorted = res.data.notifications.sort((a, b) => b.created_at - a.created_at);
                    const newUnread = sorted.filter(n => n.status === 'unread').length;
                    
                    // Show a toast if unread count increased (very basic detection)
                    if (newUnread > lastCount && lastCount !== 0 && sorted.length > 0) {
                        const latestUnread = sorted.find(n => n.status === 'unread');
                        if (latestUnread) {
                            setToast({ id: latestUnread.id, title: latestUnread.title, message: latestUnread.message });
                            setTimeout(() => setToast(null), 5000);
                        }
                    }
                    
                    lastCount = newUnread;
                    setNotifications(sorted);
                    setUnreadCount(newUnread);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications(); // Immediate
        const interval = setInterval(fetchNotifications, 30000); // 30s polling
        
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        const isAll = id === 'all';
        setNotifications(prev => prev.map(n => 
            (isAll || n.id === id) ? { ...n, status: 'read' } : n
        ));
        setUnreadCount(isAll ? 0 : unreadCount - 1);
        
        await apiMarkNotificationRead(id);
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        const notif = notifications.find(n => n.id === id);
        if (notif?.status === 'unread') {
            setUnreadCount(Math.max(0, unreadCount - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        await apiDeleteNotification(id);
    };

    const formatDate = (ts: number) => {
        const d = new Date(ts * 1000);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{ position: "relative" }} ref={dropdownRef}>
            {/* Action Button */}
            {variant === "topbar" ? (
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        padding: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569"
                    }}
                    aria-label="Notifications"
                >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: "absolute",
                            top: "4px",
                            right: "6px",
                            width: "8px",
                            height: "8px",
                            backgroundColor: "#DC2626", // Red dot
                            borderRadius: "50%",
                            border: "2px solid white"
                        }}></span>
                    )}
                </button>
            ) : variant === "popup-item" ? (
                <div 
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "11px 14px", borderBottom: "1px solid var(--border)",
                        fontSize: "13.5px", color: "var(--text)", fontWeight: 500, cursor: "pointer",
                        borderTopLeftRadius: "10px", borderTopRightRadius: "10px"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                    <Bell size={14} />
                    <span style={{ flex: 1 }}>Notifications</span>
                    {unreadCount > 0 && (
                        <span style={{ 
                            background: "#DC2626", color: "white", fontSize: "10px", fontWeight: 700,
                            padding: "2px 6px", borderRadius: "99px" 
                        }}>
                            {unreadCount} New
                        </span>
                    )}
                </div>
            ) : (
                <div 
                    onClick={() => setIsOpen(!isOpen)}
                    className="nav-item"
                    style={{ cursor: "pointer", position: "relative", marginBottom: "8px" }}
                >
                    <Bell size={16} />
                    <span style={{ flex: 1 }}>Notifications</span>
                    {unreadCount > 0 && (
                        <span style={{ 
                            background: "#DC2626", color: "white", fontSize: "11px", fontWeight: 700,
                            padding: "2px 6px", borderRadius: "99px" 
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </div>
            )}

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: "absolute",
                    ...(variant === "topbar" ? { top: "100%", right: "0", marginTop: "8px" } : 
                        variant === "popup-item" ? { bottom: "0", left: "100%", marginLeft: "14px" } : 
                        { bottom: "100%", left: "0", marginBottom: "8px" }),
                    width: "320px",
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
                    border: "1px solid #E2E8F0",
                    zIndex: 50,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "450px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#1E293B" }}>Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                onClick={() => handleMarkAsRead('all')}
                                style={{ background: "none", border: "none", color: "#3B82F6", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
                                <Bell size={32} style={{ margin: "0 auto 12px auto", opacity: 0.2 }} />
                                No notifications yet.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                {notifications.map((n) => (
                                    <div key={n.id} style={{
                                        padding: "16px",
                                        borderBottom: "1px solid #F1F5F9",
                                        backgroundColor: n.status === 'unread' ? "#EFF6FF" : "white",
                                        display: "flex",
                                        gap: "12px",
                                        transition: "background 0.2s"
                                    }}>
                                        {/* Unread indicator line */}
                                        {n.status === 'unread' && (
                                            <div style={{ width: "3px", backgroundColor: "#3B82F6", borderRadius: "2px", flexShrink: 0 }}></div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A" }}>{n.title}</div>
                                                <div style={{ fontSize: "11px", color: "#64748B" }}>{formatDate(n.created_at)}</div>
                                            </div>
                                            <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", marginBottom: "8px" }}>
                                                {n.message}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                                {n.status === 'unread' && (
                                                    <button 
                                                        onClick={() => handleMarkAsRead(n.id)}
                                                        style={{ background: "none", border: "none", color: "#3B82F6", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} /> Read
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDelete(n.id)}
                                                    style={{ background: "none", border: "none", color: "#64748B", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", padding: 0 }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notification Toast Triggered on New Notification */}
            {toast && (
                <div style={{
                    position: "fixed",
                    bottom: "24px",
                    left: "24px",
                    backgroundColor: "white",
                    padding: "16px 20px",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    width: "300px",
                    animation: "slideIn 0.3s ease-out forwards"
                }}>
                    <div style={{ backgroundColor: "#EFF6FF", color: "#3B82F6", padding: "8px", borderRadius: "50%", display: "flex" }}>
                        <Bell size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "#3B82F6", fontWeight: 700, marginBottom: "4px" }}>
                            New Notification
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A", marginBottom: "2px" }}>{toast.title}</div>
                        <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>{toast.message}</div>
                    </div>
                    <button 
                        onClick={() => setToast(null)}
                        style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
                    >
                        &times;
                    </button>
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
