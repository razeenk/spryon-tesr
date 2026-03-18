"use client";

import React, { forwardRef } from "react";
import QRCode from "react-qr-code";

interface PrintableQrCardProps {
    restaurantName: string;
    tableName: string;
    url: string;
}

const PrintableQrCard = forwardRef<HTMLDivElement, PrintableQrCardProps>(
    ({ restaurantName, tableName, url }, ref) => {
        return (
            <div
                ref={ref}
                style={{
                    width: "1080px", // High-res for printing
                    height: "1920px",
                    background: "linear-gradient(135deg, #A7F3D0 0%, #FFFFFF 30%, #FFFFFF 70%, #A7F3D0 100%)",
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {/* Subtle Floating Food Icons Background */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, pointerEvents: "none" }}>
                    <svg style={{ position: "absolute", top: "5%", left: "10%", width: "80px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.5c-5 0-9-3.5-9-7.5 0-3 2-6.5 5-7.5.5-3.5 3-4.5 4-4.5s3.5 1 4 4.5c3 1 5 4.5 5 7.5 0 4-4 7.5-9 7.5zM12 8.5c-.5.5-.5 1 0 1.5s1 0 1.5-.5c.5-.5.5-1 0-1.5s-1 0-1.5.5z"/></svg>
                    <svg style={{ position: "absolute", top: "20%", right: "15%", width: "100px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <svg style={{ position: "absolute", bottom: "15%", left: "8%", width: "120px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg>
                    <svg style={{ position: "absolute", bottom: "25%", right: "10%", width: "90px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "60px" }}>
                        <h2 style={{ fontSize: "56px", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-1px" }}>
                            {restaurantName}
                        </h2>
                        <p style={{ fontSize: "32px", color: "#4B5563", margin: "10px 0 0 0", fontWeight: 500 }}>
                            Table <span style={{ color: "#059669", fontWeight: 700 }}>{tableName}</span>
                        </p>
                    </div>

                    {/* QR Code Card */}
                    <div style={{ background: "white", padding: "40px", borderRadius: "32px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
                        <QRCode
                            value={url}
                            size={400}
                            fgColor="#111827"
                            bgColor="#FFFFFF"
                            level="H"
                        />
                    </div>

                    <div style={{ marginTop: "50px", fontSize: "36px", fontWeight: 700, color: "#059669" }}>
                        Scan to view menu & order
                    </div>
                </div>

                {/* Footer Logo */}
                <div style={{ paddingBottom: "80px", textAlign: "center", zIndex: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-12.5h4v1.5h-4v-1.5zm0 3h4v1.5h-4v-1.5zm0 3h4v1.5h-4v-1.5z" fill="#059669" />
                        </svg>
                        <h1 style={{ fontSize: "48px", fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-2px" }}>
                            Spryon
                        </h1>
                    </div>
                    <p style={{ fontSize: "24px", color: "#6B7280", margin: "12px 0 0 0" }}>
                        Quick. Simple. Delicious.
                    </p>
                </div>
            </div>
        );
    }
);

PrintableQrCard.displayName = "PrintableQrCard";
export default PrintableQrCard;
