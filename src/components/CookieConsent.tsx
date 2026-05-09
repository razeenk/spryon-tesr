"use client";

import { useEffect, useState } from "react";

const COOKIE_KEY = "spryon_cookie_consent";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
        } catch { setVisible(true); }
    }, []);

    const accept = () => {
        try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch { /* ignore */ }
        setVisible(false);
    };

    const decline = () => {
        try { localStorage.setItem(COOKIE_KEY, "declined"); } catch { /* ignore */ }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <>
            {/* Backdrop blur — subtle */}
            <div style={{
                position: "fixed", inset: 0, zIndex: 9998,
                background: "rgba(15,23,42,0.18)",
                backdropFilter: "blur(1.5px)",
                WebkitBackdropFilter: "blur(1.5px)",
                animation: "cc-fade 0.3s ease",
                pointerEvents: "none",
            }} />

            {/* Banner */}
            <div id="cookie-consent-banner" style={{
                position: "fixed", bottom: 0, left: 0, right: 0,
                zIndex: 9999,
                padding: "0 0 env(safe-area-inset-bottom, 0)",
                animation: "cc-slide 0.35s cubic-bezier(0.16,1,0.3,1)",
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
                <div style={{
                    margin: "0 auto 16px",
                    maxWidth: 720,
                    background: "white",
                    border: "1px solid #E4E7EC",
                    borderRadius: 16,
                    boxShadow: "0 8px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.06)",
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    flexWrap: "wrap",
                }}>
                    {/* Cookie icon */}
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: "#ECFDF5",
                        border: "1px solid #A7F3D0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 22,
                    }}>🍪</div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 3 }}>
                            We use cookies
                        </div>
                        <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.55 }}>
                            We use cookies to improve your experience, analyse traffic, and deliver personalised content.
                            By clicking <strong style={{ color: "#0F172A" }}>Accept</strong>, you agree to our{" "}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer"
                                style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
                                Privacy Policy
                            </a>
                            {" "}and{" "}
                            <a href="/terms" target="_blank" rel="noopener noreferrer"
                                style={{ color: "#10B981", fontWeight: 600, textDecoration: "none" }}
                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}>
                                Terms of Service
                            </a>.
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                        <button id="cookie-decline-btn" onClick={decline} style={{
                            padding: "8px 16px", borderRadius: 9, border: "1px solid #E4E7EC",
                            background: "white", color: "#6B7280", fontSize: 13, fontWeight: 500,
                            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                            transition: "background 0.12s, border-color 0.12s",
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.borderColor = "#CBD5E1"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.borderColor = "#E4E7EC"; }}>
                            Decline
                        </button>
                        <button id="cookie-accept-btn" onClick={accept} style={{
                            padding: "8px 18px", borderRadius: 9, border: "none",
                            background: "linear-gradient(135deg, #34D399, #10B981)",
                            color: "white", fontSize: 13, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                            boxShadow: "0 2px 10px rgba(52,211,153,0.35)",
                            transition: "opacity 0.12s",
                        }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                            Accept All
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes cc-slide {
                    from { transform: translateY(100%); opacity: 0; }
                    to   { transform: translateY(0);    opacity: 1; }
                }
                @keyframes cc-fade {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>
        </>
    );
}
