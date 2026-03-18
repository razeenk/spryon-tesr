"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    apiLogin,
    apiForgotPassword,
    apiResetPassword,
    apiVerifyEmail,
    apiResendOtp,
    setToken,
} from "@/lib/api";

type AuthState = "login" | "login-otp" | "forgot" | "reset-otp" | "new-password" | "pw-success";

// ─── Shared primitives ────────────────────────────────────────────────────────
function Field({ label, type = "text", placeholder, value, error, onChange, autoFocus }: {
    label: string; type?: string; placeholder: string; value: string;
    error?: string; onChange: (v: string) => void; autoFocus?: boolean;
}) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{label}</label>
            <input type={type} placeholder={placeholder} value={value} autoFocus={autoFocus}
                onChange={(e) => onChange(e.target.value)}
                style={{ border: `1px solid ${error ? "#FCA5A5" : "#E4E7EC"}`, borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: "#0F172A", background: "white", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" }}
                onFocus={(e) => { e.target.style.borderColor = "#34D399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; }}
                onBlur={(e) => { e.target.style.borderColor = error ? "#FCA5A5" : "#E4E7EC"; e.target.style.boxShadow = "none"; }}
            />
            {error && <span style={{ fontSize: "12px", color: "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
            </span>}
        </div>
    );
}

function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus(); };
    const handleChange = (i: number, raw: string) => {
        const char = raw.replace(/\D/g, "").slice(-1);
        const next = [...value]; next[i] = char; onChange(next);
        if (char && i < 5) refs.current[i + 1]?.focus();
    };
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
        const next = Array(6).fill(""); digits.forEach((d, i) => { next[i] = d; });
        onChange(next); refs.current[Math.min(digits.length, 5)]?.focus();
    };
    return (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {Array(6).fill(0).map((_, i) => (
                <input key={i} ref={(el) => { refs.current[i] = el; }} type="text" inputMode="numeric"
                    maxLength={1} value={value[i] || ""} autoFocus={i === 0}
                    onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    style={{ width: "48px", height: "54px", textAlign: "center", fontSize: "20px", fontWeight: 700, color: "#0F172A", border: `1.5px solid ${value[i] ? "#34D399" : "#E4E7EC"}`, borderRadius: "10px", outline: "none", fontFamily: "inherit", background: value[i] ? "#ECFDF5" : "white", caretColor: "transparent", transition: "all 0.15s" }}
                    onFocus={(e) => { e.target.style.borderColor = "#34D399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = value[i] ? "#34D399" : "#E4E7EC"; e.target.style.boxShadow = "none"; }}
                />
            ))}
        </div>
    );
}

function Spinner() {
    return <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function ApiError({ msg }: { msg: string }) {
    return (
        <div style={{ marginTop: "12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#DC2626" }}>
            {msg}
        </div>
    );
}

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
    width: "100%", padding: "11px 16px", borderRadius: "9px", border: "none",
    background: enabled ? "#34D399" : "#A7F3D0", color: "white", fontSize: "14px",
    fontWeight: 600, cursor: enabled ? "pointer" : "not-allowed", fontFamily: "inherit",
    marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", opacity: enabled ? 1 : 0.7, transition: "background 0.15s",
});

const linkBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", color: "#6B7280", padding: 0 };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LoginFlow() {
    const router = useRouter();
    const [state, setState] = useState<AuthState>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [loginOtp, setLoginOtp] = useState<string[]>(Array(6).fill(""));
    const [resetOtp, setResetOtp] = useState<string[]>(Array(6).fill(""));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [resent, setResent] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [direction, setDirection] = useState<"forward" | "back">("forward");

    const go = useCallback((next: AuthState, dir: "forward" | "back" = "forward") => {
        setDirection(dir); setAnimating(true); setErrors({});
        setTimeout(() => { setState(next); setAnimating(false); }, 180);
    }, []);

    const clearApiErr = () => setErrors((p) => ({ ...p, api: "" }));

    // ── Login
    const handleLogin = async () => {
        const e: Record<string, string> = {};
        if (!email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email";
        if (!password) e.password = "Password is required";
        if (Object.keys(e).length > 0) { setErrors(e); return; }

        setLoading(true);
        const result = await apiLogin(email, password);
        setLoading(false);

        if (result.error) { setErrors({ password: result.error }); return; }

        if (result.data?.token) {
            setToken(result.data.token);
            // If email not verified, show OTP step
            if (!result.data.user.emailVerified) { go("login-otp"); return; }
            router.push("/");
        }
    };

    // ── Login OTP (2FA / verify after login)
    const handleLoginOtp = async () => {
        if (!loginOtp.every(Boolean)) return;
        setLoading(true);
        const result = await apiVerifyEmail(email, loginOtp.join(""));
        setLoading(false);
        if (result.error) { setErrors({ api: result.error }); return; }
        router.push("/");
    };

    // ── Forgot password
    const handleForgot = async () => {
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrors({ email: "Enter a valid email" }); return;
        }
        setLoading(true);
        await apiForgotPassword(email); // always returns 200
        setLoading(false);
        go("reset-otp");
    };

    // ── Reset OTP verify
    const handleResetOtp = async () => {
        if (!resetOtp.every(Boolean)) return;
        go("new-password");
    };

    // ── New password
    const handleNewPassword = async () => {
        const e: Record<string, string> = {};
        if (!newPw || newPw.length < 6) e.newPw = "At least 6 characters";
        if (newPw !== confirmPw) e.confirmPw = "Passwords do not match";
        if (Object.keys(e).length > 0) { setErrors(e); return; }

        setLoading(true);
        const result = await apiResetPassword(email, resetOtp.join(""), newPw);
        setLoading(false);
        if (result.error) { setErrors({ api: result.error }); return; }
        go("pw-success");
    };

    const resend = async () => {
        await apiResendOtp(email);
        setResent(true);
        setTimeout(() => setResent(false), 3000);
    };

    const slideStyle: React.CSSProperties = animating
        ? { opacity: 0, transform: direction === "forward" ? "translateX(14px)" : "translateX(-14px)" }
        : { opacity: 1, transform: "translateX(0)", transition: "opacity 0.2s ease, transform 0.2s ease" };

    return (
        <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                <div style={{ width: "32px", height: "32px", background: "#34D399", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>Spryon</span>
            </div>

            {/* Card */}
            <div style={{ background: "white", border: "1px solid #E4E7EC", borderRadius: "16px", padding: "36px 36px 32px", width: "100%", maxWidth: "420px", boxSizing: "border-box" }}>
                <div style={slideStyle}>

                    {/* ── LOGIN ── */}
                    {state === "login" && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "4px" }}>Sign in to Spryon</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "24px" }}>Access your restaurant dashboard.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <Field label="Email address" type="email" placeholder="you@restaurant.com" value={email} error={errors.email} onChange={(v) => { setEmail(v); clearApiErr(); }} autoFocus />
                                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Password</label>
                                        <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "#34D399", fontWeight: 600, fontFamily: "inherit", padding: 0 }} onClick={() => go("forgot")}>Forgot password?</button>
                                    </div>
                                    <input type="password" placeholder="Your password" value={password}
                                        onChange={(e) => { setPassword(e.target.value); clearApiErr(); }}
                                        style={{ border: `1px solid ${errors.password ? "#FCA5A5" : "#E4E7EC"}`, borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: "#0F172A", background: "white", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const, transition: "border-color 0.15s" }}
                                        onFocus={(e) => { e.target.style.borderColor = "#34D399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; }}
                                        onBlur={(e) => { e.target.style.borderColor = errors.password ? "#FCA5A5" : "#E4E7EC"; e.target.style.boxShadow = "none"; }}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
                                    />
                                    {errors.password && <span style={{ fontSize: "12px", color: "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                        {errors.password}
                                    </span>}
                                </div>
                            </div>
                            <button onClick={handleLogin} disabled={loading} style={primaryBtn(!loading)}>
                                {loading ? <><Spinner /> Signing in...</> : "Sign in →"}
                            </button>
                            <p style={{ textAlign: "center", fontSize: "12.5px", color: "#9CA3AF", marginTop: "20px" }}>
                                Don't have an account?{" "}<a href="/register" style={{ color: "#34D399", fontWeight: 600, textDecoration: "none" }}>Create account</a>
                            </p>
                        </>
                    )}

                    {/* ── LOGIN OTP (email not verified) ── */}
                    {state === "login-otp" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <div style={{ width: "50px", height: "50px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                </div>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "6px" }}>Verify your email</h2>
                                <p style={{ fontSize: "13.5px", color: "#6B7280" }}>6-digit code sent to <strong style={{ color: "#0F172A" }}>{email}</strong></p>
                                <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>Check the Worker terminal during local dev.</p>
                            </div>
                            <OtpInput value={loginOtp} onChange={setLoginOtp} />
                            {errors.api && <ApiError msg={errors.api} />}
                            <button onClick={handleLoginOtp} disabled={!loginOtp.every(Boolean) || loading} style={primaryBtn(loginOtp.every(Boolean) && !loading)}>
                                {loading ? <><Spinner /> Verifying...</> : "Verify email"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <button style={linkBtn} onClick={resend}>{resent ? "✓ Code resent!" : "Resend code"}</button>
                                <button style={{ ...linkBtn, color: "#9CA3AF", fontSize: "12.5px" }} onClick={() => go("login", "back")}>← Back to login</button>
                            </div>
                        </>
                    )}

                    {/* ── FORGOT ── */}
                    {state === "forgot" && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "4px" }}>Reset your password</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "24px" }}>Enter your account email to receive a reset code.</p>
                            <Field label="Email address" type="email" placeholder="you@restaurant.com" value={email} error={errors.email} onChange={(v) => { setEmail(v); clearApiErr(); }} autoFocus />
                            <button onClick={handleForgot} disabled={loading} style={primaryBtn(!loading)}>
                                {loading ? <><Spinner /> Sending...</> : "Send reset code →"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: "16px" }}>
                                <button style={{ ...linkBtn, color: "#9CA3AF", fontSize: "12.5px" }} onClick={() => go("login", "back")}>← Back to login</button>
                            </div>
                        </>
                    )}

                    {/* ── RESET OTP ── */}
                    {state === "reset-otp" && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "6px" }}>Enter reset code</h2>
                                <p style={{ fontSize: "13.5px", color: "#6B7280" }}>6-digit code sent to <strong style={{ color: "#0F172A" }}>{email}</strong></p>
                                <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>Check the Worker terminal during local dev.</p>
                            </div>
                            <OtpInput value={resetOtp} onChange={setResetOtp} />
                            {errors.api && <ApiError msg={errors.api} />}
                            <button onClick={handleResetOtp} disabled={!resetOtp.every(Boolean) || loading} style={primaryBtn(resetOtp.every(Boolean) && !loading)}>
                                {loading ? <><Spinner /> Verifying...</> : "Continue →"}
                            </button>
                            <div style={{ textAlign: "center", marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <button style={linkBtn} onClick={resend}>{resent ? "✓ Code resent!" : "Resend code"}</button>
                                <button style={{ ...linkBtn, color: "#9CA3AF", fontSize: "12.5px" }} onClick={() => go("forgot", "back")}>← Edit email</button>
                            </div>
                        </>
                    )}

                    {/* ── NEW PASSWORD ── */}
                    {state === "new-password" && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "4px" }}>Create new password</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "24px" }}>Choose a strong new password for your account.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <Field label="New password" type="password" placeholder="At least 6 characters" value={newPw} error={errors.newPw} onChange={(v) => { setNewPw(v); clearApiErr(); }} autoFocus />
                                <Field label="Confirm password" type="password" placeholder="Repeat new password" value={confirmPw} error={errors.confirmPw} onChange={(v) => { setConfirmPw(v); clearApiErr(); }} />
                            </div>
                            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                                {[1, 2, 3, 4].map((l) => {
                                    const len = newPw.length;
                                    const fill = l === 1 ? len >= 1 : l === 2 ? len >= 4 : l === 3 ? len >= 7 : len >= 10;
                                    const color = len >= 10 ? "#34D399" : len >= 7 ? "#60A5FA" : len >= 4 ? "#F59E0B" : "#F87171";
                                    return <div key={l} style={{ flex: 1, height: "3px", borderRadius: "99px", background: fill && len > 0 ? color : "#E4E7EC", transition: "background 0.2s" }} />;
                                })}
                            </div>
                            {errors.api && <ApiError msg={errors.api} />}
                            <button onClick={handleNewPassword} disabled={loading} style={primaryBtn(!loading)}>
                                {loading ? <><Spinner /> Updating...</> : "Update password →"}
                            </button>
                        </>
                    )}

                    {/* ── SUCCESS ── */}
                    {state === "pw-success" && (
                        <div style={{ textAlign: "center", padding: "8px 0" }}>
                            <div style={{ width: "60px", height: "60px", background: "#ECFDF5", border: "2px solid #34D399", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "6px" }}>Password updated!</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "28px" }}>Your password has been changed successfully.</p>
                            <button onClick={() => { setPassword(""); setNewPw(""); setConfirmPw(""); go("login", "back"); }} style={primaryBtn(true)}>Back to login</button>
                        </div>
                    )}

                </div>
            </div>

            <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "24px", textAlign: "center" }}>
                <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Terms</a>{" · "}
                <a href="#" style={{ color: "#6B7280", textDecoration: "underline" }}>Privacy</a>
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
        </div>
    );
}
