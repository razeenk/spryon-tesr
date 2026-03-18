"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiMe, apiUploadImage, apiUpdateRestaurantLogo, apiUpdateRestaurantConfig, apiChangePassword, apiUpdateUserProfile, apiResetMenuData, clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";
import {
    Store, User, Palette, ShieldAlert,
    Upload, Clock, Globe, DollarSign, Phone, Mail, MapPin, Link, Save,
    Eye, EyeOff, LogOut,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

const TIMEZONES = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo",
    "Asia/Dubai", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

const CURRENCIES = [
    { code: "USD", symbol: "$", label: "US Dollar" },
    { code: "EUR", symbol: "€", label: "Euro" },
    { code: "GBP", symbol: "£", label: "British Pound" },
    { code: "INR", symbol: "₹", label: "Indian Rupee" },
    { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
    { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
    { code: "AUD", symbol: "A$", label: "Australian Dollar" },
    { code: "JPY", symbol: "¥", label: "Japanese Yen" },
];

const ACCENT_PRESETS = ["#34D399", "#60A5FA", "#F59E0B", "#F87171", "#A78BFA", "#FB923C", "#EC4899"];
const BG_PRESETS = ["#F7F8FA", "#FFFFFF", "#0F172A", "#FFF9F0", "#F0FDF4", "#EFF6FF"];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function Spinner() {
    return <span style={{ width: "13px", height: "13px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>{label}</label>
            {children}
            {hint && <div style={{ fontSize: "11.5px", color: "var(--muted-light)", marginTop: "5px" }}>{hint}</div>}
        </div>
    );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--accent)" }}>{icon}</span>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
        <div onClick={onToggle} style={{ width: "38px", height: "22px", borderRadius: "99px", background: on ? "var(--accent)" : "var(--border)", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: on ? "19px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("general");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // General → Restaurant info
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [timezone, setTimezone] = useState("UTC");
    const [currency, setCurrency] = useState("USD");
    const [isOpen, setIsOpen] = useState(true);

    // Opening hours
    const [hours, setHours] = useState<Record<string, { open: string; close: string; enabled: boolean }>>(
        Object.fromEntries(DAYS.map((d) => [d, { open: "09:00", close: "22:00", enabled: true }]))
    );

    // Logo
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    // Theme (Menu Config tab)
    const [accent, setAccent] = useState("#34D399");
    const [bgColor, setBgColor] = useState("#F7F8FA");
    const [cardColor, setCardColor] = useState("#FFFFFF");
    const [headingColor, setHeadingColor] = useState("#111111");
    const [descColor, setDescColor] = useState("#888888");

    // Profile / Account
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

    useEffect(() => {
        apiMe().then((res) => {
            if (res.data?.restaurant) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const r = res.data.restaurant as any;
                if (r.name) setName(r.name);
                if (r.phone) setPhone(r.phone);
                if (r.email) setEmail(r.email ?? "");
                if (r.address) setAddress(r.address ?? "");
                if (r.slug) setSlug(r.slug ?? "");
                if (r.logo_url) setLogoUrl(r.logo_url);
                if (r.is_open !== undefined) setIsOpen(r.is_open !== 0);
                if (r.currency) setCurrency(r.currency);
                if (r.timezone) setTimezone(r.timezone);
                if (r.opening_hours) {
                    try {
                        const oh = typeof r.opening_hours === "string" ? JSON.parse(r.opening_hours) : r.opening_hours;
                        setHours((prev) => ({ ...prev, ...oh }));
                    } catch { /* ignore */ }
                }
                if (r.theme) {
                    if (r.theme.accent) setAccent(r.theme.accent);
                    if (r.theme.background) setBgColor(r.theme.background);
                    if (r.theme.cardColor) setCardColor(r.theme.cardColor);
                    if (r.theme.headingColor) setHeadingColor(r.theme.headingColor);
                    if (r.theme.descColor) setDescColor(r.theme.descColor);
                }
            }
            // apiMe returns name/email/phone at the top level — not nested under a .user key
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = res.data as any;
            if (d?.name) setAdminName(d.name);
            if (d?.email) setAdminEmail(d.email);
            if (d?.phone) setAdminPhone(d.phone);
        });
    }, []);

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        setLogoUploading(true);
        const result = await apiUploadImage(file);
        setLogoUploading(false);
        if (result.url) { setLogoUrl(result.url); await apiUpdateRestaurantLogo(result.url); }
    };

    const handleSave = async () => {
        setSaving(true);
        await apiUpdateRestaurantConfig({
            name: name.trim() || undefined,
            slug: slug.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            timezone,
            currency,
            is_open: isOpen ? 1 : 0,
            opening_hours: hours,
        });
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleSaveProfile = async () => {
        setProfileSaving(true); setProfileMsg(null);
        const res = await apiUpdateUserProfile(
            adminName.trim() || undefined,
            adminEmail.trim() || undefined,
            adminPhone.trim() || undefined,
        );
        setProfileSaving(false);
        if (res.error) {
            setProfileMsg({ ok: false, text: (res.error as string) ?? "Failed to save profile" });
        } else {
            setProfileMsg({ ok: true, text: "Profile saved!" });
            setProfileSaved(true);
            setTimeout(() => { setProfileSaved(false); setProfileMsg(null); }, 3000);
        }
    };

    const handleChangePasswordFn = async () => {
        if (!currentPw || !newPw || newPw !== confirmPw) return;
        setPwSaving(true); setPwMsg(null);
        const res = await apiChangePassword(currentPw, newPw);
        setPwSaving(false);
        if (res.data?.ok) {
            setPwMsg({ ok: true, text: "Password updated successfully!" });
            setCurrentPw(""); setNewPw(""); setConfirmPw("");
        } else {
            setPwMsg({ ok: false, text: (res.error as string) ?? "Failed to update password" });
        }
    };

    const handleResetMenu = async () => {
        if (!window.confirm("This will permanently delete all menu items and categories. Continue?")) return;
        await apiResetMenuData();
        alert("Menu data has been reset.");
    };

    const handleDeleteRestaurant = () => {
        const confirmed = window.confirm("Type DELETE to confirm permanent account deletion.");
        if (!confirmed) return;
        // Placeholder — needs a backend delete-account endpoint
        alert("Account deletion is not yet implemented. Contact support.");
    };

    const handleLogout = () => { clearToken(); router.replace("/login"); };

    const TABS = [
        { id: "general", label: "General", icon: <Store size={15} /> },
        { id: "profile", label: "Profile", icon: <User size={15} /> },
        { id: "danger", label: "Danger Zone", icon: <ShieldAlert size={15} /> },
    ];

    const inputStyle: React.CSSProperties = { width: "100%", fontSize: "13.5px" };
    const gridStyle: React.CSSProperties = { display: "grid", gap: "16px" };

    return (
        <DashboardLayout title="Settings">
            <div className="page-header">
                <div>
                    <div className="page-title">Settings</div>
                    <div className="page-subtitle">Manage your restaurant profile and preferences</div>
                </div>
                {activeTab === "general" && (
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        {saving ? <><Spinner /> Saving…</> : saved ? <><Save size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px", alignItems: "start" }}>
                {/* Left sidebar tabs */}
                <div className="card" style={{ padding: "8px" }}>
                    {TABS.map((tab) => (
                        <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "8px 12px", borderRadius: "8px", fontSize: "13.5px", fontWeight: 500, cursor: "pointer",
                            color: activeTab === tab.id ? "var(--accent-dark)" : "var(--muted)",
                            background: activeTab === tab.id ? "var(--accent-soft)" : "transparent",
                            marginBottom: "2px", transition: "background 0.12s",
                        }}>
                            {tab.icon}
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* ══ GENERAL TAB ══ */}
                    {activeTab === "general" && (<>

                        {/* Basic details */}
                        <SectionCard title="Restaurant Info" icon={<Store size={15} />}>
                            <div style={{ ...gridStyle, gridTemplateColumns: "1fr 1fr" }}>
                                <Field label="Restaurant Name">
                                    <input className="input" style={inputStyle} placeholder="My Restaurant" value={name} onChange={(e) => setName(e.target.value)} />
                                </Field>
                                <Field label="Slug — spryon.com/…" hint="Letters, numbers and dashes only">
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--muted)", pointerEvents: "none" }}>spryon.com/</span>
                                        <input className="input" style={{ ...inputStyle, paddingLeft: "82px" }} placeholder="my-restaurant" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
                                    </div>
                                </Field>
                                <Field label="Phone Number">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <Phone size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <input className="input" type="tel" style={{ ...inputStyle, paddingLeft: "30px" }} placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                </Field>
                                <Field label="Email">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <Mail size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <input className="input" type="email" style={{ ...inputStyle, paddingLeft: "30px" }} placeholder="hello@restaurant.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </Field>
                                <Field label="Address" >
                                    <div style={{ position: "relative", display: "flex", alignItems: "center", gridColumn: "1 / -1" }}>
                                        <MapPin size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <input className="input" style={{ ...inputStyle, paddingLeft: "30px" }} placeholder="123 Main Street, City, State" value={address} onChange={(e) => setAddress(e.target.value)} />
                                    </div>
                                </Field>
                                <Field label="Timezone">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <Clock size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <select className="input" style={{ ...inputStyle, paddingLeft: "30px" }} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                                            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                                        </select>
                                    </div>
                                </Field>
                                <Field label="Currency">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <DollarSign size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <select className="input" style={{ ...inputStyle, paddingLeft: "30px" }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.label} ({c.symbol})</option>)}
                                        </select>
                                    </div>
                                </Field>
                            </div>
                        </SectionCard>

                        {/* Logo */}
                        <SectionCard title="Restaurant Logo" icon={<Upload size={15} />}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                {logoPreview || logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoPreview ?? `${API}${logoUrl}`} alt="logo"
                                        style={{ width: "64px", height: "64px", borderRadius: "13px", objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: "64px", height: "64px", background: "var(--accent-soft)", borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 700, color: "var(--accent-dark)", border: "1px solid var(--border)", flexShrink: 0 }}>
                                        {name.charAt(0).toUpperCase() || "S"}
                                    </div>
                                )}
                                <div>
                                    <button className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
                                        onClick={() => logoInputRef.current?.click()} disabled={logoUploading}>
                                        {logoUploading ? <><Spinner /> Uploading…</> : <><Upload size={13} /> Upload Logo</>}
                                    </button>
                                    <div style={{ fontSize: "11.5px", color: "var(--muted-light)", marginTop: "5px" }}>PNG, JPG, WebP · max 5 MB</div>
                                    <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={handleLogoSelect} />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Open / Closed */}
                        <SectionCard title="Restaurant Status" icon={<Globe size={15} />}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <div style={{ fontSize: "13.5px", fontWeight: 500 }}>Currently {isOpen ? "Open" : "Closed"}</div>
                                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: 2 }}>Toggle to show guests whether you&apos;re accepting orders</div>
                                </div>
                                <Toggle on={isOpen} onToggle={() => setIsOpen((o) => !o)} />
                            </div>
                        </SectionCard>

                        {/* Opening hours */}
                        <SectionCard title="Opening Hours" icon={<Clock size={15} />}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                {DAYS.map((day) => {
                                    const h = hours[day];
                                    return (
                                        <div key={day} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                                            <div style={{ width: "36px", fontSize: "12.5px", fontWeight: 600, color: h.enabled ? "var(--text)" : "var(--muted)" }}>{day}</div>
                                            <Toggle on={h.enabled} onToggle={() => setHours((p) => ({ ...p, [day]: { ...p[day], enabled: !p[day].enabled } }))} />
                                            {h.enabled ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                                    <input type="time" className="input" style={{ flex: 1, fontSize: "13px" }} value={h.open}
                                                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], open: e.target.value } }))} />
                                                    <span style={{ fontSize: "12px", color: "var(--muted)" }}>to</span>
                                                    <input type="time" className="input" style={{ flex: 1, fontSize: "13px" }} value={h.close}
                                                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], close: e.target.value } }))} />
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: "12.5px", color: "var(--muted)", fontStyle: "italic" }}>Closed</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    </>)}


                    {/* ══ PROFILE / ACCOUNT TAB ══ */}
                    {activeTab === "profile" && (<>
                        <SectionCard title="Account Details" icon={<User size={15} />}>
                            <div style={{ ...gridStyle, gridTemplateColumns: "1fr 1fr" }}>
                                <Field label="Full Name">
                                    <input className="input" style={inputStyle} placeholder="Your name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                                </Field>
                                <Field label="Login Email">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <Mail size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <input className="input" type="email" style={{ ...inputStyle, paddingLeft: "30px" }} placeholder="admin@restaurant.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                                    </div>
                                </Field>
                                <Field label="Phone Number" hint="Used for account recovery and contact">
                                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                        <Phone size={13} style={{ position: "absolute", left: 10, color: "var(--muted)", pointerEvents: "none" }} />
                                        <input className="input" type="tel" style={{ ...inputStyle, paddingLeft: "30px" }} placeholder="+1 (555) 000-0000" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                                    </div>
                                </Field>
                            </div>
                            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
                                <div>
                                    <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "7px" }} onClick={handleSaveProfile} disabled={profileSaving}>
                                        {profileSaving ? <><Spinner /> Saving…</> : profileSaved ? <><Save size={14} /> Saved!</> : <><Save size={14} /> Save Details</>}
                                    </button>
                                </div>
                                {profileMsg && (
                                    <div style={{ fontSize: 12.5, fontWeight: 500, color: profileMsg.ok ? "#16A34A" : "#DC2626" }}>
                                        {profileMsg.text}
                                    </div>
                                )}
                            </div>
                        </SectionCard>

                        <SectionCard title="Change Password" icon={<Link size={15} />}>
                            <div style={{ ...gridStyle, gridTemplateColumns: "1fr" }}>
                                <Field label="Current Password">
                                    <div style={{ position: "relative" }}>
                                        <input className="input" type={showPw ? "text" : "password"} style={{ ...inputStyle, paddingRight: "38px" }} placeholder="Enter current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                                        <button onClick={() => setShowPw((p) => !p)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}>
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </Field>
                                <Field label="New Password">
                                    <input className="input" type={showPw ? "text" : "password"} style={inputStyle} placeholder="Enter new password (8+ chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                                </Field>
                                <Field label="Confirm New Password">
                                    <input className="input" type={showPw ? "text" : "password"} style={inputStyle} placeholder="Repeat new password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                                </Field>
                                {newPw && confirmPw && newPw !== confirmPw && (
                                    <div style={{ fontSize: "12.5px", color: "#DC2626" }}>Passwords do not match</div>
                                )}
                                {pwMsg && (
                                    <div style={{ fontSize: "12.5px", color: pwMsg.ok ? "#16A34A" : "#DC2626", fontWeight: 500 }}>{pwMsg.text}</div>
                                )}
                                <div>
                                    <button className="btn-primary" onClick={handleChangePasswordFn}
                                        disabled={pwSaving || !currentPw || !newPw || newPw !== confirmPw}
                                        style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                        {pwSaving ? <><Spinner /> Updating…</> : "Update Password"}
                                    </button>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard title="Two-Factor Authentication" icon={<ShieldAlert size={15} />}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "4px 0" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "13.5px", fontWeight: 500 }}>2FA is not enabled</div>
                                    <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: 2 }}>Add an extra layer of security to your account — coming soon</div>
                                </div>
                                <button className="btn-secondary" disabled style={{ fontSize: "13px" }}>Enable 2FA</button>
                            </div>
                        </SectionCard>

                        {/* Logout */}
                        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontSize: "13.5px", fontWeight: 500 }}>Sign out of your account</div>
                                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: 2 }}>You&apos;ll need to log back in to access the dashboard</div>
                            </div>
                            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "7px", background: "none", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--danger)", fontFamily: "inherit" }}
                                onMouseEnter={(e) => { (e.currentTarget).style.background = "#FEF2F2"; }}
                                onMouseLeave={(e) => { (e.currentTarget).style.background = "none"; }}>
                                <LogOut size={14} /> Log out
                            </button>
                        </div>
                    </>)}

                    {/* ══ DANGER ZONE TAB ══ */}
                    {activeTab === "danger" && (
                        <div className="card" style={{ borderColor: "#FECACA" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid #FECACA" }}>
                                <ShieldAlert size={15} color="#DC2626" />
                                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "#DC2626" }}>Danger Zone</h3>
                            </div>
                            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "16px" }}>These actions are <strong>permanent</strong> and cannot be undone.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px" }}>
                                    <div>
                                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111" }}>Reset Menu Data</div>
                                        <div style={{ fontSize: "12px", color: "#991B1B", marginTop: 2 }}>Delete all menu items and categories</div>
                                    </div>
                                    <button onClick={handleResetMenu} style={{ background: "white", color: "#DC2626", border: "1px solid #FECACA", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, fontFamily: "inherit" }}>
                                        Reset Menu
                                    </button>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px" }}>
                                    <div>
                                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#111" }}>Delete Restaurant</div>
                                        <div style={{ fontSize: "12px", color: "#991B1B", marginTop: 2 }}>Permanently remove your account and all data</div>
                                    </div>
                                    <button onClick={handleDeleteRestaurant} style={{ background: "#DC2626", color: "white", border: "1px solid #DC2626", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, fontFamily: "inherit" }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </DashboardLayout>
    );
}
