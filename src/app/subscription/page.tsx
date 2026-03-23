"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, Zap, Building2, Sparkles, CreditCard, Loader2 } from "lucide-react";
import { useDashboard } from "@/lib/useDashboard";
import { getToken } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Plan = Record<string, any>;

export default function SubscriptionPage() {
    const { data } = useDashboard();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${API}/api/public/plans`)
            .then(res => res.json())
            .then(d => {
                if (d.ok) setPlans(d.plans || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

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
        const token = getToken();
        if (!token) { alert("Please log in first"); setUpgrading(null); return; }

        try {
            const res = await fetch(`${API}/api/payment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: plan.price_monthly * 100, currency: "USD", isSubscription: true, planId: plan.id })
            });

            const d = await res.json();
            if (!d.ok) { alert(d.error || 'Failed to initialize payment'); setUpgrading(null); return; }

            const options = {
                key: d.key,
                subscription_id: d.subscriptionId,
                name: "Spryon Cloudflare",
                description: `Upgrade to ${plan.name}`,
                handler: async function (response: any) {
                    // Success!
                    alert("Subscription successful! Your account has been upgraded.");
                    window.location.reload();
                },
                theme: { color: "#34D399" }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function () {
                alert("Payment failed. Please try again.");
                setUpgrading(null);
            });
            rzp.open();
        } catch (e) {
            console.error(e);
            alert("Error initiating checkout.");
            setUpgrading(null);
        }
    };

    const activePlanName = (data?.restaurant as any)?.plan_short_name || "FREE";
    const activePlanFullName = plans.find(p => p.short_name === activePlanName)?.name || "Free Base Plan";

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel your active subscription? Your plan will remain active until the end of its billing period.")) return;
        
        const token = getToken();
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch(`${API}/api/subscription/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const d = await res.json();
            if (d.ok) {
                alert("Subscription cancelled successfully.");
                window.location.reload();
            } else {
                alert(d.error || "Failed to cancel subscription");
            }
        } catch (e) {
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout title="Subscription">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="page-title">Subscription</div>
                    <div className="page-subtitle">Manage your plan and billing</div>
                </div>
            </div>

            {/* Current plan banner */}
            <div style={{
                background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
                border: "1px solid #BBF7D0",
                borderRadius: "14px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "28px",
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "10px",
                    background: "#16A34A20", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0
                }}>
                    <CreditCard size={18} color="#16A34A" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#15803D" }}>You&apos;re on the {activePlanFullName}</div>
                    <div style={{ fontSize: "12.5px", color: "#166534", marginTop: 2 }}>
                        Upgrade anytime to unlock more features
                    </div>
                </div>
                {activePlanName !== "FREE" && (
                    <button 
                        onClick={handleCancel}
                        style={{
                            padding: "6px 12px", background: "white", color: "#EF4444", fontSize: "12px",
                            fontWeight: 600, border: "1px solid #FCA5A5", borderRadius: "8px",
                            cursor: "pointer", transition: "all 0.2s"
                        }}
                    >
                        Cancel Plan
                    </button>
                )}
                <span style={{
                    fontSize: "11px", fontWeight: 700, background: "#16A34A", color: "white",
                    padding: "3px 10px", borderRadius: "99px", letterSpacing: "0.05em", textTransform: "uppercase"
                }}>
                    ACTIVE PLAN
                </span>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                    <Loader2 size={24} color="#16A34A" className="animate-spin" />
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "36px" }}>
                    {/* Inject a default Free Plan visually if they are on it and it's not in the DB, though DB should contain it conceptually */}
                    {plans.map((plan, idx) => {
                        const isCurrent = plan.short_name === activePlanName;
                        const isRecommended = idx === 1; // highlight 2nd plan usually
                        const isComingSoon = plan.status === "coming_soon";

                        // Collect Features
                        let features: string[] = [];
                        if (plan.base_plan_id) {
                            const base = plans.find(p => p.id === plan.base_plan_id);
                            if (base) features.push(`Everything in ${base.name}`);
                        }
                        features.push(`${plan.table_limit === -1 ? 'Unlimited' : plan.table_limit} Tables`);
                        features.push(`${plan.scan_limit === -1 ? 'Unlimited' : plan.scan_limit.toLocaleString()} Scans / month`);
                        const parsed = plan.features ? JSON.parse(plan.features) : [];
                        features = [...features, ...parsed];

                        const color = idx === 0 ? "#6B7280" : idx === 1 ? "#34D399" : "#0F172A";
                        const accent = idx === 0 ? "#F3F4F6" : idx === 1 ? "#ECFDF5" : "#F8FAFC";
                        const icon = idx === 0 ? <Sparkles size={20} /> : idx === 1 ? <Zap size={20} /> : <Building2 size={20} />;

                        return (
                            <div key={plan.id} style={{
                                background: "white",
                                border: isRecommended ? `2px solid ${color}` : "1px solid var(--border)",
                                borderRadius: "16px",
                                padding: "24px",
                                position: "relative",
                                boxShadow: isRecommended ? `0 4px 24px ${color}22` : "0 1px 4px rgba(0,0,0,0.04)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "20px",
                                opacity: isComingSoon ? 0.7 : 1
                            }}>
                                {isRecommended && (
                                    <div style={{
                                        position: "absolute", top: "-1px", left: "50%",
                                        transform: "translateX(-50%) translateY(-50%)",
                                        background: color, color: "white",
                                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                                        padding: "3px 12px", borderRadius: "99px",
                                        whiteSpace: "nowrap",
                                    }}>
                                        RECOMMENDED
                                    </div>
                                )}
                                {isComingSoon && (
                                    <div style={{
                                        position: "absolute", top: "12px", right: "12px",
                                        background: "#E2E8F0", color: "#475569",
                                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
                                        padding: "3px 10px", borderRadius: "99px", textTransform: "uppercase"
                                    }}>
                                        Coming Soon
                                    </div>
                                )}

                                <div>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: "10px",
                                        background: accent,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: color, marginBottom: "14px",
                                    }}>
                                        {icon}
                                    </div>
                                    <div style={{ fontSize: "17px", fontWeight: 700, color: "#111", marginBottom: 4 }}>
                                        {plan.name}
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                    <span style={{ fontSize: "34px", fontWeight: 800, color: "#111", letterSpacing: "-1px" }}>
                                        ${plan.price_monthly}
                                    </span>
                                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>/per month</span>
                                </div>

                                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                                    {features.map((f, i) => (
                                        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "9px", fontSize: "13.5px", color: "#374151" }}>
                                            <Check size={15} style={{ color: color, flexShrink: 0, marginTop: 1 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={isCurrent || isComingSoon || upgrading !== null}
                                    onClick={() => handleUpgrade(plan)}
                                    style={{
                                        width: "100%",
                                        padding: "11px",
                                        borderRadius: "10px",
                                        border: isCurrent ? "1px solid var(--border)" : "none",
                                        background: isCurrent || isComingSoon ? "transparent" : color,
                                        color: isCurrent || isComingSoon ? "#9CA3AF" : "white",
                                        fontWeight: 600,
                                        fontSize: "13.5px",
                                        cursor: isCurrent || isComingSoon || upgrading !== null ? "default" : "pointer",
                                        transition: "opacity 0.15s",
                                    }}
                                    onMouseEnter={(e) => { if (!isCurrent && !isComingSoon && !upgrading) (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                                >
                                    {upgrading === plan.id ? <><Loader2 size={14} className="animate-spin inline mr-1" /> Processing...</> : 
                                     isCurrent ? "Current Plan" : 
                                     isComingSoon ? "Coming Soon" : 
                                     `Upgrade to ${plan.short_name}`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </DashboardLayout>
    );
}
