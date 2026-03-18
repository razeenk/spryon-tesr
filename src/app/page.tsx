"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Stats from "@/components/Stats";
import RecentScans from "@/components/RecentScans";
import TablesOverview from "@/components/TablesOverview";
import { useDashboard } from "@/lib/useDashboard";

// ─── Status full-screen configs ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    emoji: "⏳",
    gradient: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
    accentColor: "#F59E0B",
    borderColor: "#FDE68A",
    titleColor: "#78350F",
    textColor: "#92400E",
    badgeBg: "#FEF3C7",
    badgeText: "UNDER REVIEW",
    title: "Pending Verification",
    subtitle: "Your account is being reviewed",
    message: "Your restaurant account is currently under review by the Spryon team. This usually takes 1–2 business days. You'll receive an email once your account is approved and you can start using all features.",
    tips: [
      "Make sure your restaurant name and details are accurate.",
      "You'll get an email when your account is approved.",
      "Contact support@spryon.com if it's been more than 48 hours.",
    ],
  },
  suspended: {
    emoji: "⚠️",
    gradient: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
    accentColor: "#F97316",
    borderColor: "#FDBA74",
    titleColor: "#7C2D12",
    textColor: "#9A3412",
    badgeBg: "#FFEDD5",
    badgeText: "SUSPENDED",
    title: "Account Suspended",
    subtitle: "Temporary access restriction",
    message: "Your account has been temporarily suspended. This may be due to a violation of our terms of service or a billing issue. Please contact our support team to resolve this and restore access.",
    tips: [
      "Review our Terms of Service for compliance.",
      "Check if there are any outstanding billing issues.",
      "Contact support@spryon.com to appeal this decision.",
    ],
  },
  banned: {
    emoji: "🚫",
    gradient: "linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)",
    accentColor: "#EF4444",
    borderColor: "#FCA5A5",
    titleColor: "#7F1D1D",
    textColor: "#991B1B",
    badgeBg: "#FEE2E2",
    badgeText: "BANNED",
    title: "Account Banned",
    subtitle: "Access permanently revoked",
    message: "Your account has been permanently banned from the Spryon platform due to a serious violation of our Terms of Service. If you believe this is a mistake, you may submit an appeal.",
    tips: [
      "This action was taken by the Spryon admin team.",
      "All associated data has been locked.",
      "You may contact legal@spryon.com to submit an appeal.",
    ],
  },
};

// ─── Fullscreen Status Wall ──────────────────────────────────────────────────
function StatusWall({ status, reason }: { status: keyof typeof STATUS_CONFIG; reason?: string | null }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{
      position: "fixed", inset: 0, background: cfg.gradient,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", zIndex: 9999, fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 540, textAlign: "center" }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 24, background: "white",
          border: `2px solid ${cfg.borderColor}`, display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: 38,
          boxShadow: `0 8px 32px ${cfg.accentColor}20`,
        }}>
          {cfg.emoji}
        </div>

        {/* Badge */}
        <div style={{
          display: "inline-block", background: cfg.badgeBg, border: `1px solid ${cfg.borderColor}`,
          borderRadius: 20, padding: "4px 14px", marginBottom: 16,
          fontSize: 11, fontWeight: 800, color: cfg.accentColor, letterSpacing: "0.1em",
        }}>
          {cfg.badgeText}
        </div>

        {/* Title */}
        <div style={{ fontSize: 26, fontWeight: 800, color: cfg.titleColor, letterSpacing: "-0.5px", marginBottom: 6 }}>
          {cfg.title}
        </div>
        <div style={{ fontSize: 14.5, color: cfg.textColor, opacity: 0.8, marginBottom: 20 }}>
          {cfg.subtitle}
        </div>

        {/* Card */}
        <div style={{
          background: "white", border: `1px solid ${cfg.borderColor}`,
          borderRadius: 16, padding: "24px 28px", textAlign: "left",
          boxShadow: `0 4px 20px ${cfg.accentColor}10`,
          marginBottom: reason ? 14 : 20,
        }}>
          <p style={{ fontSize: 14, color: cfg.textColor, lineHeight: 1.65, margin: "0 0 18px" }}>
            {cfg.message}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cfg.tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", background: `${cfg.accentColor}18`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cfg.accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: cfg.textColor, opacity: 0.85, lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reason (if set by admin) */}
        {reason && (
          <div style={{
            background: `${cfg.accentColor}10`, border: `1px solid ${cfg.borderColor}`,
            borderRadius: 12, padding: "12px 18px", marginBottom: 20, textAlign: "left",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg.accentColor, letterSpacing: "0.06em", marginBottom: 4 }}>
              ADMIN NOTE
            </div>
            <div style={{ fontSize: 13.5, color: cfg.titleColor }}>{reason}</div>
          </div>
        )}

        {/* Spryon branding */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 26, height: 26, background: "#34D399", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: cfg.titleColor, opacity: 0.7 }}>Spryon Dashboard</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function Home() {
  const { data } = useDashboard();
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" }));
  }, []);

  const status = data?.restaurant?.status ?? "active";
  const restaurantName = data?.restaurant?.name ?? "Your Restaurant";
  const rejectionReason = data?.restaurant?.rejection_reason;

  // Block entire dashboard for non-active restaurants
  if (data && status !== "active") {
    return <StatusWall status={status as keyof typeof STATUS_CONFIG} reason={rejectionReason} />;
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="page-header">
        <div>
          <div className="page-title">Overview</div>
          <div className="page-subtitle">{dateStr}{restaurantName ? ` · ${restaurantName}` : ""}</div>
        </div>
        <a href="/tables" style={{ textDecoration: "none" }}>
          <button className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Table
          </button>
        </a>
      </div>

      <Stats />

      <div className="dashboard-grid">
        <RecentScans />
        <TablesOverview />
      </div>
    </DashboardLayout>
  );
}


