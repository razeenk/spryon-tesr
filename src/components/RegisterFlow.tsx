"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    apiRegister,
    apiVerifyEmail,
    apiResendOtp,
    setToken,
    getToken,
} from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

async function apiGet<T>(path: string): Promise<{ data?: T; error?: string }> {
    const token = getToken();
    try {
        const res = await fetch(`${API}${path}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const d = await res.json() as { ok?: boolean; error?: string } & T;
        if (!res.ok || !d.ok) return { error: d.error ?? "Request failed" };
        return { data: d };
    } catch (e) { return { error: e instanceof Error ? e.message : "Network error" }; }
}
async function apiPost<T>(path: string, body: unknown): Promise<{ data?: T; error?: string }> {
    const token = getToken();
    try {
        const res = await fetch(`${API}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(body),
        });
        const d = await res.json() as { ok?: boolean; error?: string } & T;
        if (!res.ok || !d.ok) return { error: d.error ?? "Request failed" };
        return { data: d };
    } catch (e) { return { error: e instanceof Error ? e.message : "Network error" }; }
}

// ─── Types ──────────────────────────────────────────────────────────────────
type Step = 0 | 1 | 2 | 3;

interface FormData {
    name: string;
    email: string;
    phone: string;
    restaurantName: string;
    city: string;           // display text
    locationId: string;     // resolved from picker
    state: string;          // for custom submission
    country: string;
    password: string;
    confirmPassword: string;
}

interface Errors {
    name?: string; email?: string; phone?: string;
    restaurantName?: string; city?: string;
    password?: string; confirmPassword?: string;
    api?: string;
}

const STEPS = ["Account", "Restaurant", "Security", "Verify"];

// ─── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
    return (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            {STEPS.map((label, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                            <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: done || active ? "#34D399" : "transparent",
                                border: done || active ? "none" : "2px solid #E4E7EC",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 600, flexShrink: 0,
                                color: done || active ? "white" : "#9CA3AF",
                                transition: "all 0.25s ease",
                            }}>
                                {done ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : i + 1}
                            </div>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: active ? "#065F46" : done ? "#34D399" : "#9CA3AF", letterSpacing: "0.02em", transition: "color 0.25s" }}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{ flex: 1, height: "1.5px", margin: "0 8px", marginBottom: "16px", background: done ? "#34D399" : "#E4E7EC", transition: "background 0.3s ease" }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Field ───────────────────────────────────────────────────────────────────
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

// ─── OTP Input ───────────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
    };
    const handleChange = (i: number, raw: string) => {
        const char = raw.replace(/\D/g, "").slice(-1);
        const next = [...value]; next[i] = char;
        onChange(next);
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
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
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

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
    width: "100%", padding: "11px 16px", borderRadius: "9px", border: "none",
    background: enabled ? "#34D399" : "#A7F3D0", color: "white", fontSize: "14px",
    fontWeight: 600, cursor: enabled ? "pointer" : "not-allowed", fontFamily: "inherit",
    marginTop: "20px", display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", opacity: enabled ? 1 : 0.7, transition: "background 0.15s",
});

// ─── Location Picker ─────────────────────────────────────────────────────────
interface LocOption { id: string; city: string; state: string | null; country: string; status: string; service_available: number; }

function LocationPicker({
    value, locationId, state, country, error,
    onChange,
}: {
    value: string; locationId: string; state: string; country: string; error?: string;
    onChange: (info: { city: string; locationId: string; state: string; country: string }) => void;
}) {
    const [options, setOptions] = useState<LocOption[]>([]);
    const [loadingLoc, setLoadingLoc] = useState(true);
    const [mode, setMode] = useState<"select" | "custom">("select");
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetch(`${API}/api/public/locations`)
            .then(r => r.json() as Promise<{ ok?: boolean; locations?: LocOption[] }>)
            .then(d => { setOptions(d.locations ?? []); setLoadingLoc(false); })
            .catch(() => setLoadingLoc(false));
    }, []);

    const filtered = options.filter(o =>
        o.city.toLowerCase().includes(search.toLowerCase()) ||
        (o.state ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const selectOption = (o: LocOption) => {
        onChange({ city: o.city, locationId: o.id, state: o.state ?? "", country: o.country });
        setSearch(""); setOpen(false);
    };



    if (mode === "custom") {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Your location</label>
                    <button type="button" onClick={() => { setMode("select"); onChange({ city: "", locationId: "", state: "", country: "India" }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#34D399", fontFamily: "inherit", padding: 0 }}>← Choose from list</button>
                </div>
                <input
                    placeholder="City *" value={value}
                    onChange={(e) => onChange({ city: e.target.value, locationId: "", state, country })}
                    style={{ border: `1px solid ${error ? "#FCA5A5" : "#E4E7EC"}`, borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: "#0F172A", background: "white", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#34D399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = error ? "#FCA5A5" : "#E4E7EC"; e.target.style.boxShadow = "none"; }}
                />
                <input
                    placeholder="State (optional)" value={state}
                    onChange={(e) => onChange({ city: value, locationId, state: e.target.value, country })}
                    style={{ border: "1px solid #E4E7EC", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: "#0F172A", background: "white", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                    onFocus={(e) => { e.target.style.borderColor = "#34D399"; e.target.style.boxShadow = "0 0 0 3px rgba(52,211,153,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E4E7EC"; e.target.style.boxShadow = "none"; }}
                />
                <select value={country} onChange={(e) => onChange({ city: value, locationId, state, country: e.target.value })}
                    style={{ border: "1px solid #E4E7EC", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: "#0F172A", background: "white", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}>
                    {["India","Bangladesh","Pakistan","Sri Lanka","Nepal","Indonesia","Malaysia","Singapore","UAE","Saudi Arabia","USA","UK","Australia","Canada","Other"].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "9px 11px", fontSize: 12, color: "#92400E" }}>
                    📍 Your city will be submitted for review. You can still use Spryon while it&apos;s pending.
                </div>
                {error && <span style={{ fontSize: "12px", color: "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                </span>}
            </div>
        );
    }

    return (
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>City / Location</label>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                style={{ border: `1px solid ${error ? "#FCA5A5" : open ? "#34D399" : "#E4E7EC"}`, boxShadow: open ? "0 0 0 3px rgba(52,211,153,0.15)" : "none", borderRadius: "9px", padding: "10px 13px", fontSize: "14px", color: value ? "#0F172A" : "#9CA3AF", background: "white", outline: "none", fontFamily: "inherit", width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.15s, box-shadow 0.15s" }}
            >
                <span>{value ? `${value}${options.find(o => o.id === locationId)?.state ? `, ${options.find(o => o.id === locationId)?.state}` : ""}` : "Select your city…"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s", color: "#9CA3AF" }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "white", border: "1px solid #E4E7EC", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: 300 }}>
                    <div style={{ padding: "8px 10px", borderBottom: "1px solid #F1F5F9" }}>
                        <input
                            autoFocus
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search cities…"
                            style={{ width: "100%", border: "1px solid #E4E7EC", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "#0F172A", background: "#F9FAFB", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ overflowY: "auto", maxHeight: 220 }}>
                        {loadingLoc ? (
                            <div style={{ padding: "16px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>Loading…</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ padding: "12px 14px", fontSize: 13, color: "#9CA3AF" }}>No results</div>
                        ) : filtered.map(o => (
                            <button key={o.id} type="button" onClick={() => selectOption(o)}
                                style={{ display: "flex", alignItems: "center", width: "100%", padding: "9px 14px", background: locationId === o.id ? "#ECFDF5" : "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left", gap: 8 }}>

                                <span style={{ flex: 1 }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>{o.city}</span>
                                    {o.state && <span style={{ fontSize: 12, color: "#6B7280" }}>, {o.state}</span>}
                                </span>
                                {o.status === "coming_soon" && <span style={{ fontSize: 10.5, color: "#60A5FA", background: "rgba(96,165,250,0.1)", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Soon</span>}
                                {locationId === o.id && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                            </button>
                        ))}
                    </div>
                    <button type="button" onClick={() => { setOpen(false); setMode("custom"); }}
                        style={{ display: "flex", width: "100%", padding: "9px 14px", borderTop: "1px solid #F1F5F9", background: "#F9FAFB", border: "none", cursor: "pointer", fontFamily: "inherit", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6B7280", fontWeight: 600 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        My city isn&apos;t listed
                    </button>
                </div>
            )}

            {error && <span style={{ fontSize: "12px", color: "#EF4444", display: "flex", alignItems: "center", gap: "4px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
            </span>}
            {/* ℹ️ Service / coming-soon notice */}
            {locationId && (() => {
                const sel = options.find(o => o.id === locationId);
                if (!sel) return null;
                if (sel.status === "coming_soon") return (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#92400E" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        ⏳ Physical service is <strong>coming soon</strong> to your area! You can still sign up and use Spryon online.
                    </div>
                );
                if (!sel.service_available) return (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 7, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#1E40AF" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        ℹ️ Physical services are not yet available in your area. You can still use Spryon fully online.
                    </div>
                );
                return null;
            })()}
        </div>
    );
}


function validate(step: Step, data: FormData): Errors {
    const e: Errors = {};
    if (step === 0) {
        if (!data.name.trim()) e.name = "Full name is required";
        if (!data.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email";
        if (!data.phone.trim()) e.phone = "Phone number is required";
    }
    if (step === 1) {
        if (!data.restaurantName.trim()) e.restaurantName = "Restaurant name is required";
        if (!data.city.trim()) e.city = "Please select or enter your city";
    }
    if (step === 2) {
        if (!data.password) e.password = "Password is required";
        else if (data.password.length < 6) e.password = "At least 6 characters";
        if (!data.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
    }
    return e;
}

// ─── Plan Selection + Razorpay Component ─────────────────────────────────────
interface Plan { id: string; name: string; price_monthly: number; scan_limit: number; table_limit: number; features: string; }

function PlanStep({ name, onDone }: { name: string; onDone: () => void }) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);
    const [done, setDone] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        apiGet<{ plans: Plan[] }>("/api/plans").then((res) => {
            if (res.data?.plans) setPlans(res.data.plans);
            setLoadingPlans(false);
        });
    }, []);

    const loadRazorpay = (): Promise<boolean> =>
        new Promise((resolve) => {
            if ((window as unknown as Record<string, unknown>).Razorpay) return resolve(true);
            const s = document.createElement("script");
            s.src = "https://checkout.razorpay.com/v1/checkout.js";
            s.onload = () => resolve(true);
            s.onerror = () => resolve(false);
            document.body.appendChild(s);
        });

    const startPayment = async () => {
        if (!selected) return;
        const plan = plans.find((p) => p.id === selected)!;
        setErr(null);

        // Free plan — skip payment
        if (plan.price_monthly <= 0) {
            setDone(true);
            return;
        }

        setPaying(true);
        const subRes = await apiPost<{ subscriptionId: string; keyId: string; plan: Plan }>("/api/payment/create-order", { plan_id: selected });
        setPaying(false);
        if (subRes.error || !subRes.data) { setErr(subRes.error ?? "Could not create subscription"); return; }

        const loaded = await loadRazorpay();
        if (!loaded) { setErr("Could not load Razorpay. Check your connection."); return; }

        const { subscriptionId, keyId } = subRes.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rz = new (window as any).Razorpay({
            key: keyId,
            subscription_id: subscriptionId,
            name: "Spryon",
            description: `${plan.name} Plan`,
            theme: { color: "#34D399" },
            handler: async (response: { razorpay_subscription_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                const verifyRes = await apiPost("/api/payment/verify", {
                    razorpay_subscription_id: response.razorpay_subscription_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    plan_id: selected,
                });
                if (verifyRes.error) { setErr(verifyRes.error); return; }
                setDone(true);
            },
        });
        rz.open();
    };

    if (done) {
        return (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ width: "60px", height: "60px", background: "#ECFDF5", border: "2px solid #34D399", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "6px", letterSpacing: "-0.4px" }}>You&apos;re all set, {name}!</h2>
                <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "8px", lineHeight: 1.6 }}>
                    Your account is <strong>pending approval</strong> by the Spryon team.<br />
                    You&apos;ll receive an email once your restaurant is verified.
                </p>
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400E", marginBottom: 24, textAlign: "left" }}>
                    ⏳ <strong>What happens next?</strong><br />
                    Our team reviews your account within 24 hours. You&apos;ll get an email approval confirmation.
                </div>
                <button onClick={onDone} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #34D399, #059669)", border: "none", borderRadius: "10px", color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Go to Dashboard →
                </button>
            </div>
        );
    }

    return (
        <div>
            <div style={{ textAlign: "center", marginBottom: "22px" }}>
                <div style={{ width: "52px", height: "52px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.4px" }}>Choose your plan</h2>
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Select a plan to get started. You can upgrade anytime.</p>
            </div>

            {loadingPlans ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                    <div style={{ width: 22, height: 22, border: "2.5px solid #E4E7EC", borderTopColor: "#34D399", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                </div>
            ) : plans.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9CA3AF", fontSize: 13, padding: "24px 0" }}>
                    No plans available yet. You&apos;ll be on the free tier.
                    <br /><br />
                    <button onClick={() => setDone(true)} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#34D399,#059669)", border: "none", borderRadius: "9px", color: "white", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" }}>Continue →</button>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {plans.map((plan) => {
                        const features: string[] = (() => { try { return JSON.parse(plan.features ?? "[]"); } catch { return []; } })();
                        const isSel = selected === plan.id;
                        const isFree = plan.price_monthly <= 0;
                        return (
                            <div
                                key={plan.id}
                                onClick={() => setSelected(plan.id)}
                                style={{
                                    border: `2px solid ${isSel ? "#34D399" : "#E4E7EC"}`,
                                    borderRadius: "12px",
                                    padding: "14px 16px",
                                    cursor: "pointer",
                                    background: isSel ? "#ECFDF5" : "white",
                                    transition: "all 0.15s",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${isSel ? "#34D399" : "#D1D5DB"}`, background: isSel ? "#34D399" : "white", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {isSel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "white" }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{plan.name}</span>
                                        {isFree && <span style={{ fontSize: 10.5, fontWeight: 700, background: "#ECFDF5", color: "#059669", padding: "2px 7px", borderRadius: 20, border: "1px solid #A7F3D0" }}>FREE</span>}
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 800, color: isSel ? "#059669" : "#0F172A", marginBottom: 4 }}>
                                        {isFree ? "₹0" : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                                        <span style={{ fontSize: 12, fontWeight: 500, color: "#9CA3AF" }}>/mo</span>
                                    </div>
                                    <div style={{ fontSize: 11.5, color: "#6B7280", marginBottom: features.length ? 6 : 0 }}>
                                        {plan.table_limit} tables · {plan.scan_limit.toLocaleString()} scans/mo
                                    </div>
                                    {features.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                            {features.map((f: string, i: number) => (
                                                <span key={i} style={{ fontSize: 10.5, background: "#F1F5F9", color: "#475569", padding: "2px 6px", borderRadius: 5 }}>{f}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {err && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#DC2626", marginBottom: 12 }}>{err}</div>}

            {plans.length > 0 && (
                <button
                    onClick={startPayment}
                    disabled={!selected || paying}
                    style={{
                        width: "100%", padding: "13px",
                        background: selected && !paying ? "linear-gradient(135deg, #34D399, #059669)" : "#E4E7EC",
                        border: "none", borderRadius: "10px",
                        color: selected && !paying ? "white" : "#9CA3AF",
                        fontSize: "15px", fontWeight: 700, cursor: selected && !paying ? "pointer" : "default",
                        fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "background 0.2s",
                    }}
                >
                    {paying ? (
                        <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Processing…</>
                    ) : selected && plans.find(p => p.id === selected)?.price_monthly === 0 ? "Continue with Free Plan →" : "Pay & Continue →"}
                </button>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RegisterFlow() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [refCode, setRefCode] = useState<string | null>(null);

    // ─── Per-field sanitizers ─────────────────────────────────────────────────
    const SANITIZERS: Partial<Record<keyof FormData, (v: string) => string>> = {
        name:            (v) => v.replace(/<[^>]*>/g, "").replace(/[<>"]/g, ""),
        email:           (v) => v.replace(/<[^>]*>/g, "").replace(/javascript\s*:/gi, "").toLowerCase().trim(),
        phone:           (v) => v.replace(/[^0-9\s+\-().]/g, ""),
        restaurantName:  (v) => v.replace(/<[^>]*>/g, "").replace(/[<>"]/g, ""),
        city:            (v) => v.replace(/<[^>]*>/g, "").replace(/[<>"]/g, ""),
        // passwords: strip tags only — preserve all special chars for password strength
        password:        (v) => v.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<[^>]*>/g, ""),
        confirmPassword: (v) => v.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<[^>]*>/g, ""),
    };
    const [step, setStep] = useState<Step>(0);
    const [data, setData] = useState<FormData>({ name: "", email: "", phone: "", restaurantName: "", city: "", locationId: "", state: "", country: "India", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState<Errors>({});
    const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
    const [loading, setLoading] = useState(false);
    const [verified, setVerified] = useState(false);
    const [resent, setResent] = useState(false);
    const [direction, setDirection] = useState<"forward" | "back">("forward");
    const [animating, setAnimating] = useState(false);
    const [globalLogo, setGlobalLogo] = useState<string | null>(null);
    const [globalTitle, setGlobalTitle] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/api/public/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.ok && data.settings) {
                    if (data.settings.global_logo_url) setGlobalLogo(data.settings.global_logo_url);
                    if (data.settings.global_title) setGlobalTitle(data.settings.global_title);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) setRefCode(ref.toUpperCase());
    }, [searchParams]);

    const set = (key: keyof FormData) => (val: string) => {
        const sanitized = SANITIZERS[key] ? SANITIZERS[key]!(val) : val;
        setData((p) => ({ ...p, [key]: sanitized }));
        if (errors[key as keyof Errors]) setErrors((p) => ({ ...p, [key]: undefined, api: undefined }));
    };

    const navigate = useCallback((to: Step, dir: "forward" | "back") => {
        setDirection(dir);
        setAnimating(true);
        setTimeout(() => { setStep(to); setAnimating(false); }, 180);
    }, []);

    const next = async () => {
        const e = validate(step, data);
        if (Object.keys(e).length > 0) { setErrors(e); return; }
        setErrors({});

        if (step === 2) {
            // Call real API
            setLoading(true);
            const result = await apiRegister({
                name: data.name, email: data.email, phone: data.phone,
                restaurantName: data.restaurantName, city: data.city, password: data.password,
                ...(refCode ? { ref: refCode } : {}),
            });
            setLoading(false);

            if (result.error) { setErrors({ api: result.error }); return; }
            if (result.data?.token) setToken(result.data.token);

            // Submit location in background (non-blocking — user proceeds regardless)
            if (data.city.trim()) {
                apiPost("/api/locations/submit", {
                    ...(data.locationId ? { locationId: data.locationId } : { city: data.city, state: data.state || undefined, country: data.country }),
                }).catch(() => { /* ignore — not critical */ });
            }

            navigate(3, "forward");
        } else {
            navigate((step + 1) as Step, "forward");
        }
    };

    const verify = async () => {
        if (otp.join("").length < 6) return;
        setLoading(true);
        const result = await apiVerifyEmail(data.email, otp.join(""));
        setLoading(false);
        if (result.error) { setErrors({ api: result.error }); return; }
        setVerified(true);
    };

    const resend = async () => {
        await apiResendOtp(data.email);
        setResent(true);
        setTimeout(() => setResent(false), 3000);
    };

    const slideStyle: React.CSSProperties = animating
        ? { opacity: 0, transform: direction === "forward" ? "translateX(16px)" : "translateX(-16px)" }
        : { opacity: 1, transform: "translateX(0)", transition: "opacity 0.22s ease, transform 0.22s ease" };

    return (
        <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={globalLogo ? (globalLogo.startsWith("http") ? globalLogo : `${API}${globalLogo}`) : "/logo.png"}
                    alt="Spryon"
                    width={32} height={32}
                    style={{ borderRadius: "9px", flexShrink: 0, objectFit: "cover" }}
                />
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.3px" }}>{globalTitle || "Spryon"}</span>
            </div>

            {/* Card */}
            <div style={{ background: "white", border: "1px solid #E4E7EC", borderRadius: "16px", padding: "36px 36px 32px", width: "100%", maxWidth: "420px", boxSizing: "border-box" }}>
                <StepIndicator current={step} />

                <div style={slideStyle}>
                    {/* Step 0 */}
                    {step === 0 && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.4px" }}>Create your account</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: refCode ? "12px" : "24px" }}>Fill in your details to create your account.</p>
                            {refCode && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 9, padding: "8px 12px", marginBottom: 20 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ fontSize: 12.5, color: "#065F46", fontWeight: 600 }}>Referred by a Spryon partner — bonus applied!</span>
                                    <code style={{ marginLeft: "auto", fontSize: 11, background: "#D1FAE5", padding: "2px 7px", borderRadius: 6, color: "#047857" }}>{refCode}</code>
                                </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <Field label="Full name" placeholder="Jane Smith" value={data.name} error={errors.name} onChange={set("name")} autoFocus />
                                <Field label="Email address" type="email" placeholder="jane@restaurant.com" value={data.email} error={errors.email} onChange={set("email")} />
                                <Field label="Phone number" type="tel" placeholder="+1 (555) 000-0000" value={data.phone} error={errors.phone} onChange={set("phone")} />
                            </div>
                            <button onClick={next} style={primaryBtn(true)}>Continue →</button>
                            <p style={{ textAlign: "center", fontSize: "12.5px", color: "#9CA3AF", marginTop: "20px" }}>
                                Already have an account?{" "}<a href="/login" style={{ color: "#34D399", fontWeight: 600, textDecoration: "none" }}>Sign in</a>
                            </p>
                        </>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.4px" }}>Your restaurant</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "24px" }}>Tell us about your place. You can update this any time.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <Field label="Restaurant name" placeholder="Sakura Ramen" value={data.restaurantName} error={errors.restaurantName} onChange={set("restaurantName")} autoFocus />
                                <LocationPicker
                                    value={data.city}
                                    locationId={data.locationId}
                                    state={data.state}
                                    country={data.country}
                                    error={errors.city}
                                    onChange={({ city, locationId, state, country }) => {
                                        setData(p => ({ ...p, city, locationId, state, country }));
                                        if (errors.city) setErrors(p => ({ ...p, city: undefined }));
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                                <button onClick={() => navigate(0, "back")} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: "9px", border: "1px solid #E4E7EC", background: "white", color: "#374151", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: "0", whiteSpace: "nowrap" }}>← Back</button>
                                <button onClick={next} style={{ ...primaryBtn(true), marginTop: 0, flex: 1 }}>Continue →</button>
                            </div>
                        </>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <>
                            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", marginBottom: "4px", letterSpacing: "-0.4px" }}>Secure your account</h2>
                            <p style={{ fontSize: "13.5px", color: "#6B7280", marginBottom: "24px" }}>Choose a strong password to protect your dashboard.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <Field label="Password" type="password" placeholder="At least 6 characters" value={data.password} error={errors.password} onChange={set("password")} autoFocus />
                                <Field label="Confirm password" type="password" placeholder="Repeat your password" value={data.confirmPassword} error={errors.confirmPassword} onChange={set("confirmPassword")} />
                            </div>
                            {/* Strength bar */}
                            <div style={{ display: "flex", gap: "6px", marginTop: "12px" }}>
                                {[1, 2, 3, 4].map((l) => {
                                    const len = data.password.length;
                                    const fill = l === 1 ? len >= 1 : l === 2 ? len >= 4 : l === 3 ? len >= 7 : len >= 10;
                                    const color = len >= 10 ? "#34D399" : len >= 7 ? "#60A5FA" : len >= 4 ? "#F59E0B" : "#F87171";
                                    return <div key={l} style={{ flex: 1, height: "3px", borderRadius: "99px", background: fill && len > 0 ? color : "#E4E7EC", transition: "background 0.2s" }} />;
                                })}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "6px" }}>
                                {data.password.length >= 10 ? "Strong password ✓" : data.password.length >= 7 ? "Good — nearly there" : data.password.length >= 4 ? "Fair — getting better" : data.password.length > 0 ? "Weak — add more characters" : "Use 6+ characters for a strong password"}
                            </div>
                            {errors.api && (
                                <div style={{ marginTop: "12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#DC2626" }}>
                                    {errors.api}
                                </div>
                            )}
                            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                                <button onClick={() => navigate(1, "back")} style={{ flex: "0 0 auto", padding: "11px 16px", borderRadius: "9px", border: "1px solid #E4E7EC", background: "white", color: "#374151", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>← Back</button>
                                <button onClick={next} disabled={loading} style={{ ...primaryBtn(!loading), marginTop: 0, flex: 1 }}>
                                    {loading ? <><Spinner /> Creating account...</> : "Create account →"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Verify */}
                    {step === 3 && !verified && (
                        <>
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <div style={{ width: "52px", height: "52px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                </div>
                                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.4px", marginBottom: "6px" }}>Verify your email</h2>
                                <p style={{ fontSize: "13.5px", color: "#6B7280", lineHeight: 1.5 }}>
                                    We sent a 6-digit code to<br />
                                    <strong style={{ color: "#0F172A" }}>{data.email}</strong>
                                </p>
                            </div>

                            <OtpInput value={otp} onChange={setOtp} />

                            {errors.api && (
                                <div style={{ marginTop: "12px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#DC2626", textAlign: "center" }}>
                                    {errors.api}
                                </div>
                            )}

                            <button onClick={verify} disabled={!otp.every(Boolean) || loading} style={{ ...primaryBtn(otp.every(Boolean) && !loading), marginTop: "20px" }}>
                                {loading ? <><Spinner /> Verifying...</> : "Verify email"}
                            </button>

                            <div style={{ textAlign: "center", marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <button onClick={resend} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: resent ? "#34D399" : "#6B7280", fontFamily: "inherit", padding: 0 }}>
                                    {resent ? "✓ Code resent!" : "Didn't receive it? Resend code"}
                                </button>
                                <button onClick={() => navigate(2, "back")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12.5px", color: "#9CA3AF", fontFamily: "inherit", padding: 0 }}>
                                    ← Edit email address
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Email Verified → Plan Selection → Razorpay */}
                    {step === 3 && verified && (
                        <PlanStep name={data.name} onDone={() => router.push("/")} />
                    )}
                </div>
            </div>

            <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "24px", textAlign: "center" }}>
                <a href="/terms" style={{ color: "#6B7280", textDecoration: "underline" }}>Terms</a>{" · "}
                <a href="/privacy" style={{ color: "#6B7280", textDecoration: "underline" }}>Privacy</a>
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
        </div>
    );
}
