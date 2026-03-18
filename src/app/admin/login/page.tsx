"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiAdminLogin, apiAdminVerifyOtp, adminSetToken } from "@/lib/adminApi";
import { ShieldCheck, Mail, Lock, Hash, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<"credentials" | "otp">("credentials");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!email || !password) { setError("Email and password required"); return; }
        setLoading(true); setError("");
        const res = await apiAdminLogin(email, password);
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        setStep("otp");
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
        setLoading(true); setError("");
        const res = await apiAdminVerifyOtp(email, otp);
        setLoading(false);
        if (res.error) { setError(res.error); return; }
        if (res.data?.token) {
            adminSetToken(res.data.token);
            router.replace("/admin");
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Inter, system-ui, sans-serif" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: "100%", maxWidth: 400 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #34D399, #059669)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <ShieldCheck size={28} color="white" />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9" }}>Super Admin Access</div>
                    <div style={{ fontSize: 13.5, color: "#64748B", marginTop: 4 }}>
                        {step === "credentials" ? "Secure login requires email verification OTP" : `OTP sent to ${email}`}
                    </div>
                </div>

                {/* Card */}
                <div style={{ background: "#0F1629", border: "1px solid #1E293B", borderRadius: 16, padding: "28px 28px" }}>
                    {error && (
                        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#F87171" }}>
                            {error}
                        </div>
                    )}

                    {step === "credentials" ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Email Address</label>
                                <div style={{ position: "relative" }}>
                                    <Mail size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                        placeholder="admin@spryon.app"
                                        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, padding: "11px 12px 11px 36px", color: "#F1F5F9", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <Lock size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                                    <input
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                        placeholder="••••••••••••"
                                        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, padding: "11px 38px 11px 36px", color: "#F1F5F9", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                                    />
                                    <button onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}>
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                style={{ background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: 10, padding: "13px", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
                                {loading ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <><ArrowRight size={15} /> Send OTP</>}
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "12px 14px" }}>
                                <div style={{ fontSize: 12.5, color: "#34D399", fontWeight: 600 }}>✓ OTP Sent</div>
                                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Check {email} for a 6-digit code. Expires in 5 minutes.</div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>6-Digit OTP</label>
                                <div style={{ position: "relative" }}>
                                    <Hash size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569" }} />
                                    <input
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                                        placeholder="000000"
                                        maxLength={6}
                                        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 9, padding: "11px 12px 11px 36px", color: "#F1F5F9", fontSize: 20, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.2em", outline: "none", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading || otp.length !== 6}
                                style={{ background: otp.length === 6 ? "linear-gradient(135deg, #34D399, #059669)" : "#1E293B", border: "none", borderRadius: 10, padding: "13px", color: "white", fontSize: 14, fontWeight: 700, cursor: otp.length === 6 ? "pointer" : "default", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                {loading ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> : <><ShieldCheck size={15} /> Verify & Login</>}
                            </button>
                            <button onClick={() => { setStep("credentials"); setOtp(""); setError(""); }} style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                                ← Back to credentials
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#334155" }}>
                    Protected area — unauthorized access is logged and monitored
                </div>
            </div>
        </div>
    );
}
