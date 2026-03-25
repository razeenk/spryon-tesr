"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, Zap, Building2, Sparkles, Loader2, Crown, AlertCircle, XCircle, Calendar } from "lucide-react";
import { getToken, authHeaders } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plan = Record<string, any>;

export default function SubscriptionPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [activePlanShortName, setActivePlanShortName] = useState<string>("FREE");
    const [subStatus, setSubStatus] = useState<string>("none");       // active | cancelled | expired | none
    const [subExpiresAt, setSubExpiresAt] = useState<number | null>(null);
    const [subStartedAt, setSubStartedAt] = useState<number | null>(null);
    const [subPlanName, setSubPlanName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    // Fetch plans + current plan from /auth/me (has plan_short_name + sub details)
    const loadData = async () => {
        setLoading(true);
        const token = getToken();
        try {
            const [plansRes, meRes] = await Promise.all([
                fetch(`${API}/api/public/plans`),
                token ? fetch(`${API}/auth/me`, { headers: authHeaders() }) : null,
            ]);
            const plansData = await plansRes.json();
            if (plansData.ok) setPlans(plansData.plans || []);

            if (meRes) {
                const meData = await meRes.json();
                const r = meData?.restaurant;
                if (r) {
                    if (r.plan_short_name) setActivePlanShortName(r.plan_short_name);
                    if (r.sub_status) setSubStatus(r.sub_status);
                    if (r.sub_expires_at) setSubExpiresAt(r.sub_expires_at);
                    if (r.sub_started_at) setSubStartedAt(r.sub_started_at);
                    if (r.sub_plan_name) setSubPlanName(r.sub_plan_name);
                }
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Load Razorpay Script
    useEffect(() => {
        if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const handleUpgrade = async (plan: Plan) => {
        setUpgrading(plan.id);
        setError(null);
        const token = getToken();
        if (!token) { setError("Please log in first"); setUpgrading(null); return; }

        try {
            const res = await fetch(`${API}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ planId: plan.id })
            });

            const d = await res.json();
            if (!d.ok) { setError(d.error || 'Failed to initialize payment'); setUpgrading(null); return; }

            const options = {
                key: d.keyId,
                subscription_id: d.subscriptionId,
                name: "Spryon",
                description: `Upgrade to ${plan.name}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch(`${API}/api/payment/verify`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                razorpay_subscription_id: response.razorpay_subscription_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                plan_id: plan.id,
                            })
                        });
                        const vd = await verifyRes.json();
                        if (vd.ok) {
                            // Re-fetch current plan so card updates immediately
                            await loadData();
                            setUpgrading(null);
                        } else {
                            setError(vd.error || 'Payment verification failed');
                            setUpgrading(null);
                        }
                    } catch {
                        setError('Payment verification failed. Please contact support.');
                        setUpgrading(null);
                    }
                },
                theme: { color: "#34D399" }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function () {
                setError("Payment failed. Please try again.");
                setUpgrading(null);
            });
            rzp.open();
            setUpgrading(null);
        } catch (e) {
            console.error(e);
            setError("Network error. Please try again.");
            setUpgrading(null);
        }
    };

    const handleCancel = async () => {
        const token = getToken();
        if (!token) return;
        setCancelling(true);
        setError(null);
        try {
            const res = await fetch(`${API}/api/subscription/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const d = await res.json();
            if (d.ok) {
                setCancelConfirm(false);
                await loadData();
            } else {
                setError(d.error || "Failed to cancel subscription");
            }
        } catch {
            setError("Network error.");
        } finally {
            setCancelling(false);
        }
    };

    const planIcons = [
        <Sparkles key="spark" size={22} />,
        <Zap key="zap" size={22} />,
        <Building2 key="bldg" size={22} />,
        <Crown key="crown" size={22} />,
    ];

    const planColors = [
        { color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
        { color: "#10B981", bg: "#ECFDF5", border: "#6EE7B7" },
        { color: "#6366F1", bg: "#EEF2FF", border: "#A5B4FC" },
        { color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D" },
    ];

    const activePlanObj = plans.find(p => p.short_name === activePlanShortName);
    const activePlanFullName = activePlanObj?.name || "Free Base Plan";
    const fmt = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const nowTs = Math.floor(Date.now() / 1000);
    const inGracePeriod = subStatus === 'cancelled' && subExpiresAt && subExpiresAt > nowTs;
    const graceDaysLeft = inGracePeriod ? Math.max(0, Math.ceil((subExpiresAt - nowTs) / 86400)) : 0;
    const isSubscribed = subStatus === 'active';

    return (
        <DashboardLayout title="Subscription">
            <div className="page-header">
                <div>
                    <div className="page-title">Subscription</div>
                    <div className="page-subtitle">
                        Currently using: <strong>{activePlanFullName}</strong>
                        {activePlanShortName !== "FREE" && (
                            <button
                                onClick={handleCancel}
                                style={{
                                    marginLeft: 12, padding: "3px 10px",
                                    background: "none", color: "#EF4444", fontSize: "12px",
                                    fontWeight: 600, border: "1px solid #FCA5A5", borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px",
                    padding: "12px 16px", marginBottom: "20px",
                    display: "flex", alignItems: "center", gap: "10px",
                }}>
                    <AlertCircle size={16} color="#EF4444" />
                    <span style={{ fontSize: "13.5px", color: "#B91C1C", fontWeight: 500 }}>{error}</span>
                    <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: "18px", lineHeight: 1 }}>×</button>
                </div>
            )}

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                    <Loader2 size={26} color="#10B981" className="animate-spin" />
                </div>
            ) : (
                <>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
                        gap: "18px",
                        marginBottom: "32px",
                    }}>
                        {plans.map((plan, idx) => {
                            const isCurrent = plan.short_name === activePlanShortName;
                            const isRecommended = idx === 1 && !isCurrent;
                            const isComingSoon = plan.status === "coming_soon";
                            const theme = planColors[idx] ?? planColors[planColors.length - 1];

                            let features: string[] = [];
                            if (plan.base_plan_id) {
                                const base = plans.find(p => p.id === plan.base_plan_id);
                                if (base) features.push(`Everything in ${base.name}`);
                            }
                            features.push(`${plan.table_limit === -1 ? 'Unlimited' : plan.table_limit} Tables`);
                            features.push(`${plan.scan_limit === -1 ? 'Unlimited' : (plan.scan_limit?.toLocaleString() ?? '∞')} Scans / month`);
                            const parsed = plan.features ? JSON.parse(plan.features) : [];
                            features = [...features, ...parsed];

                            return (
                                <div key={plan.id} style={{
                                    background: isCurrent
                                        ? `linear-gradient(160deg, ${theme.bg} 0%, white 100%)`
                                        : "white",
                                    border: isCurrent
                                        ? `2px solid ${theme.color}60`
                                        : isRecommended
                                            ? `2px solid ${theme.color}`
                                            : "1px solid var(--border)",
                                    borderRadius: "18px",
                                    padding: "26px",
                                    position: "relative",
                                    boxShadow: isCurrent
                                        ? `0 6px 28px ${theme.color}20`
                                        : isRecommended
                                            ? `0 8px 32px ${theme.color}25`
                                            : "0 1px 4px rgba(0,0,0,0.05)",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "20px",
                                    opacity: isComingSoon ? 0.65 : 1,
                                    transform: (isRecommended || isCurrent) ? "translateY(-2px)" : "none",
                                }}>
                                    {/* Top badge */}
                                    {isCurrent && (
                                        <div style={{
                                            position: "absolute", top: "-1px", left: "50%",
                                            transform: "translateX(-50%) translateY(-50%)",
                                            background: theme.color, color: "white",
                                            fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em",
                                            padding: "4px 14px", borderRadius: "99px",
                                            whiteSpace: "nowrap",
                                        }}>
                                            ✓ CURRENTLY USING
                                        </div>
                                    )}
                                    {isRecommended && (
                                        <div style={{
                                            position: "absolute", top: "-1px", left: "50%",
                                            transform: "translateX(-50%) translateY(-50%)",
                                            background: theme.color, color: "white",
                                            fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em",
                                            padding: "4px 14px", borderRadius: "99px",
                                            whiteSpace: "nowrap",
                                        }}>
                                            ✦ MOST POPULAR
                                        </div>
                                    )}
                                    {isComingSoon && (
                                        <div style={{
                                            position: "absolute", top: "14px", right: "14px",
                                            background: "#F1F5F9", color: "#64748B",
                                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                                            padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase",
                                        }}>
                                            Coming Soon
                                        </div>
                                    )}

                                    {/* Plan header */}
                                    <div>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: "12px",
                                            background: `${theme.color}18`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: theme.color, marginBottom: "14px",
                                            border: `1px solid ${theme.color}20`,
                                        }}>
                                            {planIcons[idx] ?? planIcons[planIcons.length - 1]}
                                        </div>
                                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginBottom: 4, letterSpacing: "-0.3px" }}>
                                            {plan.name}
                                        </div>
                                        {plan.price_monthly === 0 ? (
                                            <div style={{ fontSize: "28px", fontWeight: 900, color: "#6B7280", marginTop: 6 }}>Free</div>
                                        ) : (
                                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: 6 }}>
                                                <span style={{ fontSize: "34px", fontWeight: 900, color: theme.color, letterSpacing: "-1.5px", lineHeight: 1 }}>
                                                    ${plan.price_monthly}
                                                </span>
                                                <span style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: 2 }}>/month</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: "1px", background: `linear-gradient(90deg, ${theme.color}40, transparent)` }} />

                                    {/* Features */}
                                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "9px", flex: 1 }}>
                                        {features.map((f, i) => (
                                            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "9px", fontSize: "13.5px", color: "#374151" }}>
                                                <span style={{
                                                    width: 18, height: 18, borderRadius: "50%",
                                                    background: `${theme.color}18`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    flexShrink: 0, marginTop: 1,
                                                }}>
                                                    <Check size={11} color={theme.color} strokeWidth={3} />
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA Button */}
                                    <button
                                        disabled={isCurrent || isComingSoon || upgrading !== null}
                                        onClick={() => handleUpgrade(plan)}
                                        style={{
                                            width: "100%",
                                            padding: "12px",
                                            borderRadius: "10px",
                                            border: isCurrent ? `1px solid ${theme.color}50` : "none",
                                            background: isCurrent
                                                ? theme.bg
                                                : isComingSoon
                                                    ? "#F1F5F9"
                                                    : theme.color,
                                            color: isCurrent ? theme.color : isComingSoon ? "#9CA3AF" : "white",
                                            fontWeight: 700,
                                            fontSize: "14px",
                                            cursor: isCurrent || isComingSoon || upgrading !== null ? "default" : "pointer",
                                            transition: "opacity 0.15s, transform 0.1s",
                                            boxShadow: (!isCurrent && !isComingSoon) ? `0 4px 14px ${theme.color}40` : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isCurrent && !isComingSoon && !upgrading) {
                                                (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
                                                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                                            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                                        }}
                                    >
                                        {upgrading === plan.id
                                            ? <><Loader2 size={14} className="animate-spin inline mr-1" /> Processing...</>
                                            : isCurrent
                                                ? "✓ Your Current Plan"
                                                : isComingSoon
                                                    ? "Coming Soon"
                                                    : `Upgrade to ${plan.name} →`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* --- Manage Subscription Section --- */}
                    {(isSubscribed || inGracePeriod) && (
                        <div style={{
                            background: "white",
                            border: isSubscribed ? "1px solid #E5E7EB" : "1px solid #FDE68A",
                            borderRadius: 14,
                            padding: "22px 26px",
                            marginBottom: 24,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: isSubscribed ? "#EEF2FF" : "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Calendar size={16} color={isSubscribed ? "#6366F1" : "#D97706"} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Manage Subscription</div>
                                    <div style={{ fontSize: 12, color: "#6B7280" }}>Billing & cancellation</div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
                                {[
                                    { label: "Plan", value: subPlanName || activePlanFullName },
                                    { label: "Status", value: isSubscribed ? "Active" : `Cancelled · ends ${fmt(subExpiresAt!)}` },
                                    { label: "Started", value: subStartedAt ? fmt(subStartedAt) : "—" },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {isSubscribed && !cancelConfirm && (
                                <button
                                    onClick={() => setCancelConfirm(true)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 7,
                                        padding: "9px 18px", background: "#FEF2F2",
                                        border: "1px solid #FECACA", borderRadius: 9,
                                        color: "#EF4444", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                                    }}
                                >
                                    <XCircle size={14} />
                                    Cancel Subscription
                                </button>
                            )}

                            {isSubscribed && cancelConfirm && (
                                <div style={{
                                    background: "#FEF2F2", border: "1px solid #FECACA",
                                    borderRadius: 10, padding: "14px 18px",
                                }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#B91C1C", marginBottom: 6 }}>⚠️ Are you sure?</div>
                                    <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.55, marginBottom: 14 }}>
                                        Your subscription will be cancelled at the end of the current billing cycle.
                                        You&apos;ll keep full access until then. After expiry, your plan will be downgraded
                                        {" "}{plans.some(p => p.price_monthly === 0) ? "to the free plan" : "and dashboard access will be restricted"}.
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancelling}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                padding: "8px 16px", background: "#EF4444", color: "white",
                                                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                                            }}
                                        >
                                            {cancelling ? <><Loader2 size={13} className="animate-spin inline" /> Cancelling...</> : "Yes, Cancel Subscription"}
                                        </button>
                                        <button
                                            onClick={() => setCancelConfirm(false)}
                                            style={{
                                                padding: "8px 16px", background: "white",
                                                border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                color: "#374151", cursor: "pointer",
                                            }}
                                        >Keep Subscription</button>
                                    </div>
                                </div>
                            )}

                            {inGracePeriod && (
                                <div style={{ fontSize: 12.5, color: "#92400E", background: "#FFFBEB", padding: "10px 14px", borderRadius: 8 }}>
                                    Subscription cancelled — you have full access until <strong>{fmt(subExpiresAt!)}</strong>.
                                    Want to continue? <a href="#plans" style={{ color: "#10B981", fontWeight: 700 }}>Pick a plan above.</a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Billing info */}
                    <div style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "14px",
                        padding: "18px 22px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: 4 }}>ℹ️ Billing Information</div>
                        {[
                            "All plans are billed monthly via Razorpay. Cancel anytime.",
                            "Upgrades take effect immediately after payment.",
                            "Cancellation keeps access until the end of the current billing cycle, then downgrades to the free plan if available.",
                        ].map((line, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", marginTop: 6, flexShrink: 0 }} />
                                <span style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5 }}>{line}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </DashboardLayout>
    );
}
