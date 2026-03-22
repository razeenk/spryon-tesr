"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { getToken, apiUploadImage, apiMe, apiUpdateRestaurantConfig, authHeaders } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category { id: string; name: string; sort_order: number; }
interface MenuItem {
    id: string; name: string; description: string | null; price: number;
    available: number; scan_count: number; image_url: string | null;
    category_id: string | null; category_name: string | null;
    is_veg: number; allergens: string[];
}

const ACCENT_PRESETS = ["#34D399", "#60A5FA", "#F59E0B", "#F87171", "#A78BFA", "#FB923C", "#EC4899"];
const BG_PRESETS = ["#F7F8FA", "#FFFFFF", "#0F172A", "#FFF9F0", "#F0FDF4", "#EFF6FF"];

const ALLERGENS_LIST = [
    { key: "gluten", label: "Gluten", emoji: "🌾" },
    { key: "dairy", label: "Dairy", emoji: "🥛" },
    { key: "nuts", label: "Nuts", emoji: "🥜" },
    { key: "eggs", label: "Eggs", emoji: "🥚" },
    { key: "soy", label: "Soy", emoji: "🫘" },
    { key: "seafood", label: "Seafood", emoji: "🦐" },
    { key: "sesame", label: "Sesame", emoji: "🌿" },
];

// ─── Small helpers ────────────────────────────────────────────────────────────
function Spinner() {
    return <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />;
}

function SocialField({ icon, label, value, enabled, onChange, onToggle }: {
    icon: React.ReactNode; label: string; value: string; enabled: boolean;
    onChange: (v: string) => void; onToggle: () => void;
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--muted)" }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)", marginBottom: "4px" }}>{label}</div>
                <input className="input" placeholder={`https://${label.toLowerCase()}.com/yourpage`} value={value} onChange={(e) => onChange(e.target.value)} disabled={!enabled} style={{ width: "100%", fontSize: "13px", padding: "6px 10px", opacity: enabled ? 1 : 0.45 }} />
            </div>
            <div onClick={onToggle} style={{ width: "36px", height: "20px", borderRadius: "99px", background: enabled ? "var(--accent)" : "var(--border)", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: enabled ? "19px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
            </div>
        </div>
    );
}

function MenuPreview({ accent, bg, cardColor, headingColor, descColor, hasSocials }: {
    accent: string; bg: string; cardColor: string;
    headingColor: string; descColor: string; hasSocials: boolean;
}) {
    const isDark = bg === "#0F172A";
    const textColor = isDark ? "#F1F5F9" : headingColor;
    const subColor = isDark ? "#94A3B8" : descColor;
    const cBg = isDark ? "#1E293B" : cardColor;
    const border = isDark ? "#334155" : `${accent}20`;
    const navBg = isDark ? "#0F172A" : "white";
    return (
        <div style={{ width: "180px", flexShrink: 0 }}>
            {/* Phone shell */}
            <div style={{
                width: "180px", height: "340px", background: "#1C1C1E",
                borderRadius: "26px", padding: "8px", boxShadow: "0 20px 48px rgba(0,0,0,0.28)",
                display: "flex", flexDirection: "column", overflow: "hidden",
            }}>
                {/* Screen */}
                <div style={{ flex: 1, background: bg, borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {/* Notch */}
                    <div style={{ height: "18px", background: navBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: "40px", height: "5px", background: isDark ? "#374151" : "#E5E7EB", borderRadius: "3px" }} />
                    </div>
                    {/* Header */}
                    <div style={{ background: navBg, padding: "6px 10px 8px", borderBottom: `1px solid ${isDark ? "#334155" : "#F3F4F6"}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                            <div style={{ width: "20px", height: "20px", background: accent, borderRadius: "5px", flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: "9px", fontWeight: 700, color: textColor }}>My Restaurant</div>
                                <div style={{ fontSize: "7px", color: subColor }}>Table 3 · 4 guests</div>
                            </div>
                        </div>
                        {/* Search bar */}
                        <div style={{ height: "14px", background: isDark ? "#374151" : "#F3F4F6", borderRadius: "4px", marginBottom: "5px" }} />
                        {/* Category pills */}
                        <div style={{ display: "flex", gap: "3px" }}>
                            {["All", "Mains", "Drinks", "Desserts"].map((c, i) => (
                                <div key={c} style={{ padding: "2px 6px", borderRadius: "8px", fontSize: "7px", fontWeight: 600, background: i === 0 ? accent : isDark ? "#374151" : "#F3F4F6", color: i === 0 ? "white" : subColor, flexShrink: 0 }}>{c}</div>
                            ))}
                        </div>
                    </div>
                    {/* Items */}
                    <div style={{ flex: 1, padding: "6px", overflowY: "hidden", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {[
                            { name: "Avocado Toast", desc: "Sourdough, egg, chili", price: "$14" },
                            { name: "Iced Matcha Latte", desc: "Oat milk, honey", price: "$7" },
                            { name: "Caesar Salad", desc: "Romaine, croutons", price: "$12" },
                        ].map((item) => (
                            <div key={item.name} style={{ background: cBg, border: `1px solid ${border}`, borderRadius: "6px", padding: "5px 7px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "8px", fontWeight: 700, color: textColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                                    <div style={{ fontSize: "6.5px", color: subColor, marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
                                </div>
                                <div style={{ fontSize: "8px", fontWeight: 700, color: accent, flexShrink: 0, marginLeft: "4px" }}>{item.price}</div>
                            </div>
                        ))}
                    </div>
                    {/* Social footer */}
                    {hasSocials && (
                        <div style={{ background: navBg, borderTop: `1px solid ${isDark ? "#334155" : "#F3F4F6"}`, padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                            <span style={{ fontSize: "6px", color: subColor, fontWeight: 600 }}>FOLLOW</span>
                            {["IG", "WA", "FB"].map((s) => (
                                <div key={s} style={{ width: "14px", height: "14px", background: isDark ? "#374151" : "#F3F4F6", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "5.5px", color: subColor, fontWeight: 700 }}>{s}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}>Live Preview</div>
        </div>
    );
}

const emptyForm = () => ({ name: "", description: "", price: "", categoryId: "", available: true, is_veg: 0 as 0 | 1 | 2, allergens: [] as string[] });

function VegToggle({ value, onChange }: { value: 0 | 1 | 2; onChange: (v: 0 | 1 | 2) => void }) {
    const opts: { v: 0 | 1 | 2; label: string; dot: string }[] = [
        { v: 0, label: "Not set", dot: "#CCC" },
        { v: 1, label: "Veg", dot: "#22C55E" },
        { v: 2, label: "Non-veg", dot: "#EF4444" },
    ];
    return (
        <div style={{ display: "flex", gap: "8px" }}>
            {opts.map((o) => (
                <button key={o.v} type="button" onClick={() => onChange(o.v)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${value === o.v ? o.dot : "var(--border)"}`, background: value === o.v ? `${o.dot}18` : "white", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "var(--text)", fontFamily: "inherit" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "2px", background: o.dot, flexShrink: 0, display: "inline-block" }} />
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function AllergenPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
    const toggle = (key: string) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
    return (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {ALLERGENS_LIST.map((a) => {
                const on = value.includes(a.key);
                return (
                    <button key={a.key} type="button" onClick={() => toggle(a.key)}
                        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "8px", border: `1.5px solid ${on ? "var(--accent)" : "var(--border)"}`, background: on ? "var(--accent-soft)" : "white", cursor: "pointer", fontSize: "12.5px", fontWeight: on ? 600 : 400, color: on ? "var(--accent-dark)" : "var(--text)", fontFamily: "inherit", transition: "all 0.12s" }}>
                        <span>{a.emoji}</span> {a.label}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Dish Modal (Add + Edit) ────────────────────────────────────────────────────────
const LABEL: React.CSSProperties = { fontSize: "12.5px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px", letterSpacing: "0.01em" };
const INPUT: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "14px", color: "#111827", background: "white", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" };
const SEC_LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", display: "block" };

function DishModal({
    mode, title, form, setForm, imgPreview, onImgChange, fileRef,
    onSave, onDelete, onClose, saving, error, categories,
}: {
    mode: "add" | "edit";
    title: string;
    form: ReturnType<typeof emptyForm>;
    setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
    imgPreview: string | null;
    onImgChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileRef: React.RefObject<HTMLInputElement | null>;
    onSave: () => void;
    onDelete?: () => void;
    onClose: () => void;
    saving: boolean;
    error: string;
    categories: Category[];
}) {
    const VEG_OPTS: { v: 0 | 1 | 2; label: string; color: string }[] = [
        { v: 0, label: "Not set", color: "#E5E7EB" },
        { v: 1, label: "Veg", color: "#BBF7D0" },
        { v: 2, label: "Non-veg", color: "#FECACA" },
    ];

    const setField = <K extends keyof ReturnType<typeof emptyForm>>(k: K, v: ReturnType<typeof emptyForm>[K]) =>
        setForm((p) => ({ ...p, [k]: v }));

    const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        (e.target.style.borderColor = "#34D399");
    const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        (e.target.style.borderColor = "#E5E7EB");

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={onClose}>
            <div style={{ background: "white", borderRadius: "16px", width: "100%", maxWidth: "660px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 60px rgba(0,0,0,0.18)", overflow: "hidden" }}
                onClick={(e) => e.stopPropagation()}>

                {/* ── Sticky Header ── */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    {imgPreview && <img src={imgPreview} alt="" style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid #E5E7EB", flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: "#111827" }}>{title}</div>
                        <div style={{ fontSize: "12.5px", color: "#9CA3AF", marginTop: "1px" }}>Fill in the dish details below</div>
                    </div>
                    <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#6B7280" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* ── Scrollable Body ── */}
                <div style={{ overflowY: "auto", flex: 1, padding: "24px" }}>

                    {/* Section 1: Basic Info */}
                    <span style={SEC_LABEL}>Basic Info</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
                        <div>
                            <label style={LABEL}>Item name <span style={{ color: "#EF4444" }}>*</span></label>
                            <input style={INPUT} placeholder="e.g. Margherita Pizza" value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                onFocus={focusStyle} onBlur={blurStyle} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                                <label style={LABEL}>Price <span style={{ color: "#EF4444" }}>*</span></label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: "14px", pointerEvents: "none" }}>$</span>
                                    <input style={{ ...INPUT, paddingLeft: "24px" }} type="number" step="0.01" placeholder="0.00" value={form.price}
                                        onChange={(e) => setField("price", e.target.value)}
                                        onFocus={focusStyle} onBlur={blurStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={LABEL}>Category</label>
                                <select style={INPUT} value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)}
                                    onFocus={focusStyle} onBlur={blurStyle}>
                                    <option value="">No category</option>
                                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Description */}
                    <span style={SEC_LABEL}>Description</span>
                    <div style={{ marginBottom: "28px" }}>
                        <textarea style={{ ...INPUT, resize: "vertical", minHeight: "78px", lineHeight: 1.5 }} placeholder="Short description visible to customers…" value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                            onFocus={focusStyle as unknown as React.FocusEventHandler<HTMLTextAreaElement>}
                            onBlur={blurStyle as unknown as React.FocusEventHandler<HTMLTextAreaElement>} />
                        <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#9CA3AF" }}>Keep it short — one or two sentences work best.</p>
                    </div>

                    {/* Section 3: Image */}
                    <span style={SEC_LABEL}>Photo</span>
                    <div style={{ marginBottom: "28px" }}>
                        <input ref={fileRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" style={{ display: "none" }} onChange={onImgChange} />
                        <div onClick={() => fileRef.current?.click()} style={{
                            position: "relative", border: `1.5px dashed ${imgPreview ? "#34D399" : "#D1D5DB"}`, borderRadius: "10px", background: "#FAFAFA", cursor: "pointer", overflow: "hidden", minHeight: "120px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", transition: "border-color 0.15s"
                        }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#34D399")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = imgPreview ? "#34D399" : "#D1D5DB")}>
                            {imgPreview ? (
                                <>
                                    <img src={imgPreview} alt="" style={{ width: "100%", height: "160px", objectFit: "cover" }} />
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.35)"; (e.currentTarget.querySelector("span") as HTMLElement).style.opacity = "1"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0)"; (e.currentTarget.querySelector("span") as HTMLElement).style.opacity = "0"; }}>
                                        <span style={{ opacity: 0, color: "white", fontSize: "13px", fontWeight: 600, transition: "opacity 0.15s", background: "rgba(0,0,0,0.5)", padding: "6px 14px", borderRadius: "8px" }}>Replace photo</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                    </div>
                                    <span style={{ fontSize: "13.5px", color: "#6B7280", fontWeight: 500 }}>Click to upload a photo</span>
                                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>PNG, JPG up to 5MB</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Section 4: Dietary */}
                    <span style={SEC_LABEL}>Dietary</span>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
                        {VEG_OPTS.map((o) => (
                            <button key={o.v} type="button" onClick={() => setField("is_veg", o.v)}
                                style={{ padding: "7px 16px", borderRadius: "8px", border: `1.5px solid ${form.is_veg === o.v ? "#34D399" : "#E5E7EB"}`, background: form.is_veg === o.v ? o.color : "white", cursor: "pointer", fontSize: "13px", fontWeight: form.is_veg === o.v ? 600 : 400, color: form.is_veg === o.v ? "#065F46" : "#374151", fontFamily: "inherit", transition: "all 0.12s" }}>
                                {o.label}
                            </button>
                        ))}
                    </div>

                    {/* Section 5: Allergens */}
                    <span style={SEC_LABEL}>Allergens</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "28px" }}>
                        {ALLERGENS_LIST.map((a) => {
                            const on = form.allergens.includes(a.key);
                            return (
                                <button key={a.key} type="button" onClick={() => setField("allergens", on ? form.allergens.filter((k) => k !== a.key) : [...form.allergens, a.key])}
                                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 11px", borderRadius: "20px", border: `1.5px solid ${on ? "#34D399" : "#E5E7EB"}`, background: on ? "#ECFDF5" : "white", cursor: "pointer", fontSize: "12.5px", fontWeight: on ? 600 : 400, color: on ? "#065F46" : "#6B7280", fontFamily: "inherit", transition: "all 0.12s" }}>
                                    {a.emoji} {a.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Section 6: Availability */}
                    <span style={SEC_LABEL}>Availability</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {[{ v: true, label: "Available", dot: "#22C55E" }, { v: false, label: "Unavailable", dot: "#D1D5DB" }].map((o) => (
                            <button key={String(o.v)} type="button" onClick={() => setField("available", o.v)}
                                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 16px", borderRadius: "8px", border: `1.5px solid ${form.available === o.v ? "#34D399" : "#E5E7EB"}`, background: form.available === o.v ? "#ECFDF5" : "white", cursor: "pointer", fontSize: "13px", fontWeight: form.available === o.v ? 600 : 400, color: form.available === o.v ? "#065F46" : "#6B7280", fontFamily: "inherit", transition: "all 0.12s" }}>
                                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: o.dot, display: "inline-block" }} />
                                {o.label}
                            </button>
                        ))}
                    </div>

                    {error && <div style={{ marginTop: "16px", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px" }}>{error}</div>}
                </div>

                {/* ── Sticky Footer ── */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexShrink: 0, background: "white" }}>
                    <div>
                        {mode === "edit" && onDelete && (
                            <button onClick={onDelete} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #FECACA", background: "none", fontSize: "13px", fontWeight: 500, cursor: "pointer", color: "#DC2626", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                Delete dish
                            </button>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", fontSize: "13.5px", fontWeight: 500, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                            Cancel
                        </button>
                        <button onClick={onSave} disabled={saving} style={{ padding: "8px 22px", borderRadius: "8px", border: "none", background: saving ? "#A7F3D0" : "#34D399", fontSize: "13.5px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", color: "white", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "7px", transition: "background 0.15s" }}
                            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#10B981"; }}
                            onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#34D399"; }}>
                            {saving ? <Spinner /> : null}
                            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Add dish"}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}

// ─── Small category modal ──────────────────────────────────────────────────────
function CategoryModal({ catName, setCatName, onSave, onClose }: { catName: string; setCatName: (v: string) => void; onSave: () => void; onClose: () => void }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
            <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "400px", boxShadow: "0 20px 50px rgba(0,0,0,0.16)", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ fontWeight: 700, fontSize: "15px", color: "#111827" }}>Add Category</div>
                </div>
                <div style={{ padding: "20px 24px" }}>
                    <label style={LABEL}>Category name</label>
                    <input style={INPUT} autoFocus placeholder="e.g. Mains, Desserts…" value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onClose(); }} />
                </div>
                <div style={{ padding: "14px 24px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", fontSize: "13.5px", cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={onSave} style={{ padding: "8px 18px", borderRadius: "8px", border: "none", background: "#34D399", fontSize: "13.5px", fontWeight: 600, cursor: "pointer", color: "white", fontFamily: "inherit" }}>Add</button>
                </div>
            </div>
        </div>
    );
}

// ─── Compact dish row inside category (categories tab) ───────────────────────────────────
function CategoryDishRow({ item, onEdit, onDelete, onToggle, saving }: {
    item: MenuItem;
    onEdit: () => void; onDelete: () => void;
    onToggle: () => void; saving: boolean;
}) {
    const imgUrl = item.image_url ? `${API}${item.image_url}` : null;
    const available = item.available === 1;
    return (
        <div style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
            borderBottom: "1px solid #F3F4F6", opacity: available ? 1 : 0.6,
            transition: "background 0.12s",
        }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>

            {/* Thumbnail */}
            <div style={{ width: "40px", height: "40px", borderRadius: "7px", flexShrink: 0, overflow: "hidden", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {imgUrl
                    ? <img src={imgUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>}
            </div>

            {/* Name */}
            <span style={{ flex: 1, fontWeight: 500, fontSize: "14px", color: "#111827", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>

            {/* Price */}
            <span style={{ fontWeight: 600, fontSize: "13.5px", color: "#374151", flexShrink: 0, minWidth: "44px", textAlign: "right" }}>${item.price.toFixed(2)}</span>

            {/* Availability */}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, minWidth: "80px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: available ? "#22C55E" : "#D1D5DB", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: available ? "#15803D" : "#9CA3AF", fontWeight: 500 }}>{available ? "Available" : "Unavailable"}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                <button onClick={onEdit} title="Edit dish" style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>Edit</button>
                <button onClick={onToggle} disabled={saving} title={available ? "Disable" : "Enable"} style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid #E5E7EB", background: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", color: available ? "#6B7280" : "#15803D", fontFamily: "inherit" }}>
                    {saving ? <Spinner /> : available ? "Disable" : "Enable"}
                </button>
                <button onClick={onDelete} title="Delete" style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", color: "#DC2626" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
            </div>
        </div>
    );
}


function DishCard({ item, onEdit, onDelete, onToggle, saving }: {
    item: MenuItem;
    onEdit: () => void; onDelete: () => void;
    onToggle: () => void; saving: boolean;
}) {
    const imgUrl = item.image_url ? `${API}${item.image_url}` : null;
    const available = item.available === 1;
    const vegColor = item.is_veg === 1 ? "#22C55E" : item.is_veg === 2 ? "#EF4444" : null;
    return (
        <div style={{
            background: "white", border: "1px solid #E8ECF0", borderRadius: "12px",
            padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px",
            opacity: available ? 1 : 0.6, transition: "box-shadow 0.15s",
        }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}>

            {/* Thumbnail */}
            <div style={{ width: "60px", height: "60px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {imgUrl
                    ? <img src={imgUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
                    {vegColor && <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: vegColor, flexShrink: 0, display: "inline-block" }} />}
                    <span style={{ fontWeight: 600, fontSize: "15px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                    {item.category_name && (
                        <span style={{ fontSize: "11px", fontWeight: 500, color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "1px 8px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0 }}>{item.category_name}</span>
                    )}
                </div>
                {item.description && (
                    <p style={{ margin: 0, fontSize: "13px", color: "#9CA3AF", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "420px" }}>{item.description}</p>
                )}
            </div>

            {/* Price */}
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#111827", flexShrink: 0, minWidth: "52px", textAlign: "right" }}>${item.price.toFixed(2)}</span>

            {/* Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0, minWidth: "88px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: available ? "#22C55E" : "#D1D5DB", flexShrink: 0 }} />
                <span style={{ fontSize: "12.5px", color: available ? "#15803D" : "#9CA3AF", fontWeight: 500 }}>{available ? "Available" : "Unavailable"}</span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={onEdit} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid #E5E7EB", background: "white", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", color: "#374151", fontFamily: "inherit", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                    Edit
                </button>
                <button onClick={onToggle} disabled={saving} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid #E5E7EB", background: "white", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", color: available ? "#6B7280" : "#15803D", fontFamily: "inherit" }}>
                    {saving ? <Spinner /> : available ? "Disable" : "Enable"}
                </button>
                <button onClick={onDelete} style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #FEE2E2", background: "#FEF2F2", fontSize: "12.5px", cursor: "pointer", color: "#DC2626", fontFamily: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
            </div>
        </div>
    );
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, onSave, saving, error }: {
    title: string; onClose: () => void; children: React.ReactNode;
    onSave: () => void; saving: boolean; error: string;
}) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
            <div style={{ background: "white", borderRadius: "18px 18px 0 0", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--muted)", lineHeight: 1 }}>×</button>
                </div>
                {children}
                {error && <div style={{ marginTop: "10px", color: "var(--danger)", fontSize: "13px" }}>{error}</div>}
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={onSave} className="btn-primary" style={{ flex: 2 }} disabled={saving}>
                        {saving ? <Spinner /> : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Color swatch picker ──────────────────────────────────────────────────────
function ColorRow({ label, value, presets, onChange }: { label: string; value: string; presets: string[]; onChange: (v: string) => void }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", minWidth: "110px" }}>{label}</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {presets.map((c) => (
                    <button key={c} onClick={() => onChange(c)} style={{
                        width: "24px", height: "24px", borderRadius: "6px", background: c, border: `2px solid ${value === c ? "var(--accent)" : "transparent"}`,
                        cursor: "pointer", padding: 0, outline: value === c ? "2px solid var(--accent)" : "none", outlineOffset: "2px",
                    }} />
                ))}
                <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
                    style={{ width: "24px", height: "24px", padding: 0, border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }} />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function MenuContent() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<"dishes" | "categories" | "config">(
        tabParam === "categories" ? "categories" : tabParam === "config" ? "config" : "dishes"
    );

    // Sync tab when URL changes (browser back/forward)
    useEffect(() => {
        const t = searchParams.get("tab");
        setActiveTab(t === "categories" ? "categories" : t === "config" ? "config" : "dishes");
    }, [searchParams]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState<string | null>(null);
    const token = getToken();

    // Add dish modal
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [formSaving, setFormSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit dish modal
    const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
    const [editForm, setEditForm] = useState(emptyForm());
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Category add/edit
    const [showAddCat, setShowAddCat] = useState(false);
    const [catName, setCatName] = useState("");
    const [editCat, setEditCat] = useState<Category | null>(null);
    const [editCatName, setEditCatName] = useState("");

    // Expanded categories in category tab
    const [expandedCat, setExpandedCat] = useState<string | null>(null);

    // Menu config (theme)
    const [accent, setAccent] = useState("#34D399");
    const [bgColor, setBgColor] = useState("#F7F8FA");
    const [cardColor, setCardColor] = useState("#FFFFFF");
    const [headingColor, setHeadingColor] = useState("#111111");
    const [descColor, setDescColor] = useState("#888888");
    const [pageTitle, setPageTitle] = useState("");
    const [pageDesc, setPageDesc] = useState("");
    const [restaurantName, setRestaurantName] = useState("");
    const [restaurantSlug, setRestaurantSlug] = useState("");
    const [linkCopied, setLinkCopied] = useState(false);
    // Social links
    const [socials, setSocials] = useState({
        instagram: "", instagram_enabled: true,
        whatsapp: "", whatsapp_enabled: true,
        facebook: "", facebook_enabled: true,
        website: "", website_enabled: true,
    });

    const [configSaving, setConfigSaving] = useState(false);
    const [configSaved, setConfigSaved] = useState(false);

    // ── Data loading ──────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/menu`, { headers: authHeaders() });
            const data = await res.json() as { ok: boolean; items: MenuItem[]; categories: Category[] };
            if (data.ok) { setItems(data.items); setCategories(data.categories); }
        } finally { setLoading(false); }
    }, [token]);

    useEffect(() => { load(); }, [load]);

    // Load theme config
    useEffect(() => {
        apiMe().then((res) => {
            if (res.data?.restaurant) {
                const r = res.data.restaurant;
                if (r.theme) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const t = r.theme as any;
                    if (t.accent) setAccent(t.accent);
                    if (t.background) setBgColor(t.background);
                    if (t.cardColor) setCardColor(t.cardColor);
                    if (t.headingColor) setHeadingColor(t.headingColor);
                    if (t.descColor) setDescColor(t.descColor);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((r as any).page_title) setPageTitle((r as any).page_title);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((r as any).page_description) setPageDesc((r as any).page_description);
                if (r.name) setRestaurantName(r.name);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((r as any).slug) setRestaurantSlug((r as any).slug);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((r as any).social_links) setSocials((prev) => ({ ...prev, ...(r as any).social_links }));
            }
        });
    }, []);

    // ── Dish actions ──────────────────────────────────────────────────────────
    const toggleAvailable = async (item: MenuItem) => {
        setSaving(item.id);
        await fetch(`${API}/api/menu/${item.id}`, { method: "PATCH", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ available: item.available === 0 }) });
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: item.available === 0 ? 1 : 0 } : i));
        setSaving(null);
    };

    const deleteItem = async (id: string) => {
        if (!confirm("Delete this menu item?")) return;
        await fetch(`${API}/api/menu/${id}`, { method: "DELETE", headers: authHeaders() });
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    const addItem = async () => {
        if (!form.name || !form.price) { setFormError("Name and price are required"); return; }
        setFormSaving(true); setFormError("");
        let image_url: string | undefined;
        if (imageFile) {
            const r = await apiUploadImage(imageFile);
            if (r.error) { setFormError(`Image upload failed: ${r.error}`); setFormSaving(false); return; }
            image_url = r.url;
        }
        const res = await fetch(`${API}/api/menu`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ name: form.name, description: form.description || undefined, price: parseFloat(form.price), categoryId: form.categoryId || undefined, available: form.available, image_url, is_veg: form.is_veg, allergens: form.allergens }) });
        const data = await res.json() as { ok: boolean };
        if (data.ok) { setShowAdd(false); setForm(emptyForm()); setImageFile(null); setImagePreview(null); await load(); }
        else setFormError("Failed to add item");
        setFormSaving(false);
    };

    const openEdit = (item: MenuItem) => {
        setEditTarget(item);
        setEditForm({ name: item.name, description: item.description ?? "", price: String(item.price), categoryId: item.category_id ?? "", available: item.available === 1, is_veg: (item.is_veg ?? 0) as 0 | 1 | 2, allergens: item.allergens ?? [] });
        setEditImageFile(null); setEditImagePreview(null); setEditError("");
    };

    const saveEdit = async () => {
        if (!editTarget) return;
        if (!editForm.name || !editForm.price) { setEditError("Name and price are required"); return; }
        setEditSaving(true); setEditError("");
        let image_url = editTarget.image_url ?? undefined;
        if (editImageFile) {
            const r = await apiUploadImage(editImageFile);
            if (r.error) { setEditError(`Image upload failed: ${r.error}`); setEditSaving(false); return; }
            image_url = r.url;
        }
        const res = await fetch(`${API}/api/menu/${editTarget.id}`, { method: "PATCH", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ name: editForm.name, description: editForm.description || null, price: parseFloat(editForm.price), categoryId: editForm.categoryId || "", available: editForm.available, image_url, is_veg: editForm.is_veg, allergens: editForm.allergens }) });
        const data = await res.json() as { ok: boolean; error?: string };
        if (data.ok) { setEditTarget(null); await load(); }
        else setEditError(data.error ?? "Failed to update item");
        setEditSaving(false);
    };

    // ── Category actions ──────────────────────────────────────────────────────
    const addCategory = async () => {
        if (!catName.trim()) return;
        const res = await fetch(`${API}/api/categories`, { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ name: catName.trim() }) });
        const data = await res.json() as { ok: boolean; id: string; name: string };
        if (data.ok) { setCategories((prev) => [...prev, { id: data.id, name: data.name, sort_order: 0 }]); }
        setCatName(""); setShowAddCat(false);
    };

    const saveEditCat = async () => {
        if (!editCat || !editCatName.trim()) { setEditCat(null); return; }
        await fetch(`${API}/api/categories/${editCat.id}`, { method: "PATCH", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ name: editCatName.trim() }) });
        setCategories((prev) => prev.map((c) => c.id === editCat.id ? { ...c, name: editCatName.trim() } : c));
        setEditCat(null);
    };

    const deleteCategory = async (cat: Category) => {
        if (!confirm(`Delete "${cat.name}"? Items in this category will become uncategorised.`)) return;
        await fetch(`${API}/api/categories/${cat.id}`, { method: "DELETE", headers: authHeaders() });
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        await load();
    };

    // ── Config save ───────────────────────────────────────────────────────────
    const saveConfig = async () => {
        setConfigSaving(true);
        await apiUpdateRestaurantConfig({
            theme: { accent, background: bgColor, text: bgColor === "#0F172A" ? "#F1F5F9" : "#0F172A", cardColor, headingColor, descColor },
            social_links: socials,
            page_title: pageTitle,
            page_description: pageDesc,
            slug: restaurantSlug || undefined,
        });
        setConfigSaving(false); setConfigSaved(true);
        setTimeout(() => setConfigSaved(false), 2500);
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const [catFilter, setCatFilter] = useState("");
    const [availFilter, setAvailFilter] = useState<"all" | "available" | "unavailable">("all");

    const filtered = items.filter((item) => {
        const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || (item.category_name ?? "").toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || item.category_id === catFilter;
        const matchAvail = availFilter === "all" || (availFilter === "available" ? item.available === 1 : item.available === 0);
        return matchSearch && matchCat && matchAvail;
    });

    const TAB_STYLE = (t: string) => ({
        padding: "8px 18px", borderRadius: "8px", cursor: "pointer",
        fontWeight: 600, fontSize: "13.5px", border: "none", fontFamily: "inherit",
        background: activeTab === t ? "var(--accent)" : "transparent",
        color: activeTab === t ? "white" : "var(--muted)",
        transition: "all 0.15s",
    } as React.CSSProperties);

    return (
        <DashboardLayout title="Menu">

            {/* ─── Header ─── */}
            <div className="page-header">
                <div>
                    <div className="page-title">Menu</div>
                    <div className="page-subtitle">{loading ? "Loading…" : `${items.length} items · ${categories.length} categories`}</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    {activeTab === "dishes" && <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Dish</button>}
                    {activeTab === "categories" && <button className="btn-primary" onClick={() => setShowAddCat(true)}>+ Add Category</button>}
                </div>
            </div>

            {/* ══════════════════════════════ DISHES TAB ══════════════════════════════ */}
            {activeTab === "dishes" && (
                <>
                    {/* Filter bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                        {/* Search */}
                        <div style={{ position: "relative", flex: "1", minWidth: "200px", maxWidth: "340px" }}>
                            <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            <input placeholder="Search dishes…" value={search} onChange={(e) => setSearch(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px 8px 34px", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "13.5px", color: "#374151", background: "white", outline: "none", fontFamily: "inherit" }} />
                        </div>
                        {/* Category filter */}
                        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                            style={{ padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "13.5px", color: "#374151", background: "white", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        {/* Availability filter */}
                        <div style={{ display: "flex", gap: "2px", background: "#F3F4F6", borderRadius: "8px", padding: "3px" }}>
                            {(["all", "available", "unavailable"] as const).map((v) => (
                                <button key={v} onClick={() => setAvailFilter(v)}
                                    style={{
                                        padding: "5px 12px", borderRadius: "6px", border: "none", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s",
                                        background: availFilter === v ? "white" : "transparent",
                                        color: availFilter === v ? "#111827" : "#6B7280",
                                        boxShadow: availFilter === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    }}>
                                    {v === "all" ? "All" : v === "available" ? "Available" : "Unavailable"}
                                </button>
                            ))}
                        </div>
                        {/* Result count */}
                        <span style={{ fontSize: "13px", color: "#9CA3AF", marginLeft: "auto" }}>{filtered.length} of {items.length} dishes</span>
                    </div>

                    {/* List */}
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: "88px", background: "#F9FAFB", borderRadius: "12px", border: "1px solid #E8ECF0", animation: "pulse 1.4s ease-in-out infinite" }} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "72px 20px", color: "#9CA3AF" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#F3F4F6", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "15px", color: "#374151", marginBottom: "6px" }}>{search || catFilter || availFilter !== "all" ? "No dishes match your filters" : "No dishes yet"}</div>
                            <div style={{ fontSize: "13.5px", marginBottom: "18px" }}>{search || catFilter || availFilter !== "all" ? "Try adjusting your search or filters." : "Add your first dish to get started."}</div>
                            {!search && !catFilter && availFilter === "all" && (
                                <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ margin: "0 auto" }}>Add first dish</button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {filtered.map((item) => (
                                <DishCard key={item.id} item={item}
                                    onEdit={() => openEdit(item)}
                                    onDelete={() => deleteItem(item.id)}
                                    onToggle={() => toggleAvailable(item)}
                                    saving={saving === item.id} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════ CATEGORIES TAB ══════════════════════════════ */}
            {activeTab === "categories" && (
                <>
                    {loading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {[1, 2, 3].map((i) => <div key={i} style={{ height: "56px", background: "white", borderRadius: "12px", border: "1px solid #E8ECF0", animation: "pulse 1.4s ease-in-out infinite" }} />)}
                        </div>
                    ) : categories.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "72px 20px", color: "#9CA3AF" }}>
                            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "#F3F4F6", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "15px", color: "#374151", marginBottom: "6px" }}>No categories yet</div>
                            <div style={{ fontSize: "13.5px", marginBottom: "18px" }}>Create categories to organise your menu.</div>
                            <button className="btn-primary" onClick={() => setShowAddCat(true)} style={{ margin: "0 auto" }}>Add first category</button>
                        </div>
                    ) : (
                        <div style={{ background: "white", border: "1px solid #E8ECF0", borderRadius: "12px", overflow: "hidden" }}>
                            {categories.map((cat, idx) => {
                                const catItems = items.filter((i) => i.category_id === cat.id);
                                const isExpanded = expandedCat === cat.id;
                                const isLast = idx === categories.length - 1;
                                return (
                                    <div key={cat.id}>
                                        {/* ── Category row ── */}
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "10px",
                                            padding: "15px 20px",
                                            background: isExpanded ? "#FAFBFC" : "white",
                                            borderBottom: (isExpanded || !isLast) ? "1px solid #F3F4F6" : "none",
                                            transition: "background 0.12s", cursor: "pointer",
                                        }}
                                            onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "#FAFBFC"; }}
                                            onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "white"; }}
                                            onClick={() => setExpandedCat(isExpanded ? null : cat.id)}>

                                            {/* Chevron */}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                style={{ flexShrink: 0, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>

                                            {/* Name / inline edit */}
                                            {editCat?.id === cat.id ? (
                                                <input autoFocus value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") saveEditCat(); if (e.key === "Escape") setEditCat(null); }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ flex: 1, padding: "5px 10px", fontSize: "14px", border: "1.5px solid #34D399", borderRadius: "7px", outline: "none", fontFamily: "inherit", color: "#111827", fontWeight: 600 }} />
                                            ) : (
                                                <span style={{ flex: 1, fontWeight: 600, fontSize: "14.5px", color: "#111827" }}>{cat.name}</span>
                                            )}

                                            {/* Item count badge */}
                                            <span style={{ fontSize: "12px", color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "2px 10px", borderRadius: "20px", flexShrink: 0, fontWeight: 500 }}>
                                                {catItems.length} {catItems.length === 1 ? "dish" : "dishes"}
                                            </span>

                                            {/* Actions */}
                                            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                                                {editCat?.id === cat.id ? (
                                                    <button onClick={saveEditCat} style={{ padding: "5px 12px", borderRadius: "7px", border: "none", background: "#34D399", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", color: "white", fontFamily: "inherit" }}>Save</button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => { setEditCat(cat); setEditCatName(cat.name); }} style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid #E5E7EB", background: "white", fontSize: "12.5px", fontWeight: 500, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                                                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>Rename</button>
                                                        <button onClick={() => deleteCategory(cat)} style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", color: "#DC2626" }}
                                                            onMouseEnter={(e) => (e.currentTarget.style.background = "#FECACA")}
                                                            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}>
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Expanded dishes ── */}
                                        {isExpanded && (
                                            <div style={{ borderLeft: "3px solid #34D399", marginLeft: "28px", background: "#FAFBFC", borderBottom: isLast ? "none" : "1px solid #F3F4F6" }}>
                                                {catItems.length === 0 ? (
                                                    <div style={{ padding: "18px 20px", fontSize: "13px", color: "#9CA3AF", display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                                        No dishes in this category yet.
                                                    </div>
                                                ) : (
                                                    catItems.map((item) => (
                                                        <CategoryDishRow key={item.id} item={item}
                                                            onEdit={() => { setActiveTab("dishes"); openEdit(item); }}
                                                            onDelete={() => deleteItem(item.id)}
                                                            onToggle={() => toggleAvailable(item)}
                                                            saving={saving === item.id} />
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* ── Uncategorised ── */}
                            {(() => {
                                const uncatItems = items.filter((i) => !i.category_id);
                                if (uncatItems.length === 0) return null;
                                const isExp = expandedCat === "__uncat__";
                                return (
                                    <div>
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: "10px", padding: "15px 20px",
                                            background: isExp ? "#FAFBFC" : "white",
                                            cursor: "pointer", transition: "background 0.12s",
                                            borderTop: "1px solid #F3F4F6",
                                        }}
                                            onClick={() => setExpandedCat(isExp ? null : "__uncat__")}
                                            onMouseEnter={(e) => { if (!isExp) e.currentTarget.style.background = "#FAFBFC"; }}
                                            onMouseLeave={(e) => { if (!isExp) e.currentTarget.style.background = "white"; }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                style={{ flexShrink: 0, transform: isExp ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                            <span style={{ flex: 1, fontWeight: 500, fontSize: "14.5px", color: "#9CA3AF", fontStyle: "italic" }}>Uncategorised</span>
                                            <span style={{ fontSize: "12px", color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "2px 10px", borderRadius: "20px", flexShrink: 0, fontWeight: 500 }}>
                                                {uncatItems.length} {uncatItems.length === 1 ? "dish" : "dishes"}
                                            </span>
                                        </div>
                                        {isExp && (
                                            <div style={{ borderLeft: "3px solid #E5E7EB", marginLeft: "28px", background: "#FAFBFC" }}>
                                                {uncatItems.map((item) => (
                                                    <CategoryDishRow key={item.id} item={item}
                                                        onEdit={() => { setActiveTab("dishes"); openEdit(item); }}
                                                        onDelete={() => deleteItem(item.id)}
                                                        onToggle={() => toggleAvailable(item)}
                                                        saving={saving === item.id} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}

            {/* ══════════════════════════════ MENU CONFIG TAB ══════════════════════════════ */}
            {activeTab === "config" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "24px", alignItems: "start" }}>

                    {/* ───────────── LEFT: Settings ───────────── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                        {/* ── SHAREABLE LINK ── */}
                        {restaurantSlug && (() => {
                            const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/${restaurantSlug}` : `https://your-domain.com/${restaurantSlug}`;
                            return (
                                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "14px", overflow: "hidden" }}>
                                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #A7F3D0" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#065F46" }}>Your Shareable Menu Link</div>
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>Share this link on Instagram bio, WhatsApp, Google Business, etc.</div>
                                    </div>
                                    <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ flex: 1, background: "white", border: "1px solid #A7F3D0", borderRadius: "9px", padding: "9px 14px", fontSize: "13px", fontFamily: "monospace", color: "#065F46", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{publicUrl}</div>
                                        <button onClick={() => { navigator.clipboard.writeText(publicUrl).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }); }}
                                            style={{ padding: "9px 16px", background: linkCopied ? "#059669" : "#10B981", color: "white", border: "none", borderRadius: "9px", cursor: "pointer", fontWeight: 600, fontSize: "13px", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px", transition: "background 0.15s" }}>
                                            {linkCopied
                                                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Copied!</>
                                                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy</>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ── MENU THEME ── */}
                        <div style={{ background: "white", border: "1px solid #E8ECF0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Menu Theme</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Customize colors shown on your public QR menu</div>
                            </div>
                            <div style={{ padding: "4px 0" }}>

                                {/* Accent color row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #F9FAFB" }}>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Accent color</div>
                                        <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "2px" }}>Buttons, active pills, prices</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        {ACCENT_PRESETS.map((color) => (
                                            <div key={color} onClick={() => setAccent(color)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: color, cursor: "pointer", boxShadow: accent === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none", transition: "box-shadow 0.15s", flexShrink: 0 }} />
                                        ))}
                                        <label style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1.5px dashed #D1D5DB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: accent, position: "relative" }} title="Custom">
                                            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ opacity: 0, width: "22px", height: "22px", position: "absolute", inset: 0, cursor: "pointer", border: "none", padding: 0 }} />
                                        </label>
                                    </div>
                                </div>

                                {/* Background row */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #F9FAFB" }}>
                                    <div>
                                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>Background</div>
                                        <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "2px" }}>Page background color</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        {BG_PRESETS.map((color) => (
                                            <div key={color} onClick={() => setBgColor(color)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: color, cursor: "pointer", border: "1.5px solid #E5E7EB", boxShadow: bgColor === color ? `0 0 0 2px white, 0 0 0 4px #374151` : "none", transition: "box-shadow 0.15s", flexShrink: 0 }} />
                                        ))}
                                        <label style={{ width: "22px", height: "22px", borderRadius: "50%", border: "1.5px dashed #D1D5DB", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: bgColor, position: "relative" }} title="Custom">
                                            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ opacity: 0, width: "22px", height: "22px", position: "absolute", inset: 0, cursor: "pointer", border: "none", padding: 0 }} />
                                        </label>
                                    </div>
                                </div>

                                {/* Card / Heading / Desc color rows */}
                                {[
                                    { label: "Card color", sub: "Item card background", val: cardColor, set: setCardColor },
                                    { label: "Heading color", sub: "Item name text", val: headingColor, set: setHeadingColor },
                                    { label: "Description color", sub: "Item description text", val: descColor, set: setDescColor },
                                ].map(({ label, sub, val, set }, idx, arr) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: idx < arr.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                        <div>
                                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>{label}</div>
                                            <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "2px" }}>{sub}</div>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "11.5px", fontFamily: "monospace", color: "#9CA3AF" }}>{val}</span>
                                            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                                                <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: val, border: "1.5px solid #E5E7EB", flexShrink: 0 }} />
                                                <input type="color" value={val} onChange={(e) => set(e.target.value)} style={{ opacity: 0, width: "30px", height: "30px", position: "absolute", inset: 0, cursor: "pointer", border: "none", padding: 0 }} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── PAGE INFO ── */}
                        <div style={{ background: "white", border: "1px solid #E8ECF0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Page Info</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Shown in the browser tab and link previews when guests open your QR link</div>
                            </div>
                            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                {/* Page title */}
                                <div>
                                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Page Title</label>
                                    <input className="input" placeholder={restaurantName ? `Our Menu | ${restaurantName}` : "e.g. Our Menu | Bella Vista"} value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} style={{ width: "100%" }} />
                                    <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "4px" }}>Appears in the browser tab — leave blank to use the default.</div>
                                </div>
                                {/* Divider */}
                                <div style={{ borderTop: "1px solid #F3F4F6" }} />
                                {/* Meta description */}
                                <div>
                                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Description</label>
                                    <textarea className="input" rows={2} placeholder={restaurantName ? `Scan to explore our full menu at ${restaurantName}` : "e.g. Scan to explore our full menu"} value={pageDesc} onChange={(e) => setPageDesc(e.target.value)} style={{ width: "100%", resize: "vertical", lineHeight: 1.5 }} />
                                    <div style={{ fontSize: "11.5px", color: "#9CA3AF", marginTop: "4px" }}>Shown in link previews when guests share your QR menu URL.</div>
                                </div>
                            </div>
                        </div>

                        {/* ── SOCIAL LINKS ── */}
                        <div style={{ background: "white", border: "1px solid #E8ECF0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>Social Links</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Appear in your public menu footer</div>
                            </div>
                            <div style={{ padding: "0" }}>
                                {[
                                    {
                                        key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourpage",
                                        enabled: socials.instagram_enabled, val: socials.instagram,
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>,
                                        color: "#E1306C",
                                        onChange: (v: string) => setSocials((p) => ({ ...p, instagram: v })),
                                        onToggle: () => setSocials((p) => ({ ...p, instagram_enabled: !p.instagram_enabled })),
                                    },
                                    {
                                        key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/yourphone",
                                        enabled: socials.whatsapp_enabled, val: socials.whatsapp,
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
                                        color: "#25D366",
                                        onChange: (v: string) => setSocials((p) => ({ ...p, whatsapp: v })),
                                        onToggle: () => setSocials((p) => ({ ...p, whatsapp_enabled: !p.whatsapp_enabled })),
                                    },
                                    {
                                        key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage",
                                        enabled: socials.facebook_enabled, val: socials.facebook,
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
                                        color: "#1877F2",
                                        onChange: (v: string) => setSocials((p) => ({ ...p, facebook: v })),
                                        onToggle: () => setSocials((p) => ({ ...p, facebook_enabled: !p.facebook_enabled })),
                                    },
                                    {
                                        key: "website", label: "Website", placeholder: "https://yourrestaurant.com",
                                        enabled: socials.website_enabled, val: socials.website,
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
                                        color: "#374151",
                                        onChange: (v: string) => setSocials((p) => ({ ...p, website: v })),
                                        onToggle: () => setSocials((p) => ({ ...p, website_enabled: !p.website_enabled })),
                                    },
                                ].map((row, idx, arr) => (
                                    <div key={row.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderBottom: idx < arr.length - 1 ? "1px solid #F9FAFB" : "none", transition: "background 0.1s" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                        {/* Platform icon */}
                                        <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: `${row.color}15`, border: `1px solid ${row.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: row.color }}>
                                            {row.icon}
                                        </div>
                                        {/* Label + input */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>{row.label}</div>
                                            <input
                                                value={row.val} onChange={(e) => row.onChange(e.target.value)}
                                                placeholder={row.placeholder}
                                                disabled={!row.enabled}
                                                style={{ width: "100%", padding: "5px 9px", fontSize: "12.5px", border: "1px solid #E5E7EB", borderRadius: "7px", outline: "none", fontFamily: "inherit", color: "#374151", background: row.enabled ? "white" : "#F9FAFB", opacity: row.enabled ? 1 : 0.5, transition: "opacity 0.15s" }}
                                                onFocus={(e) => (e.currentTarget.style.borderColor = "#34D399")}
                                                onBlur={(e) => (e.currentTarget.style.borderColor = "#E5E7EB")} />
                                        </div>
                                        {/* Toggle */}
                                        <div onClick={row.onToggle} style={{ width: "38px", height: "22px", borderRadius: "99px", background: row.enabled ? "#34D399" : "#E5E7EB", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}>
                                            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "3px", left: row.enabled ? "19px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── UTM INFO ── */}
                        <div style={{ background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: "14px", padding: "16px 20px" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                <div style={{ width: "32px", height: "32px", background: "#34D399", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#065F46", marginBottom: "5px" }}>Automatic UTM Tracking</div>
                                    <div style={{ fontSize: "12.5px", color: "#047857", lineHeight: 1.55 }}>Spryon automatically appends tracking parameters to all social links.</div>
                                    <div style={{ marginTop: "10px", background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: "8px", padding: "8px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        {[["utm_source", "spryon"], ["utm_medium", "menu"], ["utm_campaign", "restaurant_slug"]].map(([k, v]) => (
                                            <div key={k} style={{ fontSize: "11.5px", color: "#065F46", fontFamily: "monospace" }}>
                                                <span style={{ fontWeight: 700 }}>{k}</span>
                                                <span style={{ opacity: 0.6 }}>=</span>
                                                <span style={{ opacity: 0.85 }}>{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={saveConfig} disabled={configSaving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "10px", border: "none", background: configSaved ? "#059669" : "#34D399", color: "white", fontWeight: 600, fontSize: "14px", cursor: configSaving ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.2s", boxShadow: "0 2px 8px rgba(52,211,153,0.3)" }}
                                onMouseEnter={(e) => { if (!configSaving && !configSaved) e.currentTarget.style.background = "#059669"; }}
                                onMouseLeave={(e) => { if (!configSaving && !configSaved) e.currentTarget.style.background = "#34D399"; }}>
                                {configSaving ? <><Spinner /> Saving…</> : configSaved ? <>✓ Saved!</> : "Save Menu Config"}
                            </button>
                        </div>
                    </div>

                    {/* ───────────── RIGHT: Live Preview ───────────── */}
                    <div style={{ position: "sticky", top: "24px" }}>
                        <MenuPreview
                            accent={accent} bg={bgColor} cardColor={cardColor}
                            headingColor={headingColor} descColor={descColor}
                            hasSocials={[socials.instagram, socials.whatsapp, socials.facebook, socials.website].some(Boolean)} />
                    </div>
                </div>
            )}



            {/* ══ Add Dish Modal ══ */}
            {showAdd && (
                <DishModal mode="add" title="Add Dish"
                    form={form} setForm={setForm}
                    imgPreview={imagePreview}
                    onImgChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImageFile(file); const r = new FileReader(); r.onload = (ev) => setImagePreview(ev.target?.result as string); r.readAsDataURL(file); }}
                    fileRef={fileInputRef} categories={categories}
                    onSave={addItem} onClose={() => { setShowAdd(false); setForm(emptyForm()); setImageFile(null); setImagePreview(null); }}
                    saving={formSaving} error={formError} />
            )}

            {/* ══ Edit Dish Modal ══ */}
            {editTarget && (
                <DishModal mode="edit" title="Edit Dish"
                    form={editForm} setForm={setEditForm}
                    imgPreview={editImagePreview ?? (editTarget.image_url ? `${API}${editTarget.image_url}` : null)}
                    onImgChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setEditImageFile(file); const r = new FileReader(); r.onload = (ev) => setEditImagePreview(ev.target?.result as string); r.readAsDataURL(file); }}
                    fileRef={editFileInputRef} categories={categories}
                    onSave={saveEdit}
                    onDelete={async () => { if (!editTarget) return; await deleteItem(editTarget.id); setEditTarget(null); }}
                    onClose={() => setEditTarget(null)}
                    saving={editSaving} error={editError} />
            )}

            {/* ══ Add Category Modal ══ */}
            {showAddCat && (
                <CategoryModal catName={catName} setCatName={setCatName} onSave={addCategory} onClose={() => { setShowAddCat(false); setCatName(""); }} />
            )}

            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} } @keyframes spin { to{transform:rotate(360deg)} }`}</style>
        </DashboardLayout>
    );
}

export default function MenuPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MenuContent />
        </Suspense>
    );
}
