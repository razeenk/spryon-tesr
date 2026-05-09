import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy — Spryon",
    description: "How Venet, the operator of Spryon, collects, uses, and protects your personal data.",
    icons: { icon: "/favicon-rounded.png" },
};

const LAST_UPDATED = "April 25, 2026";

export default function PrivacyPage() {
    return (
        <div style={{
            minHeight: "100vh", background: "#F7F8FA",
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: "#0F172A", padding: "48px 24px 80px",
        }}>
            <style>{`
                .legal-link { color: #10B981; font-weight: 600; text-decoration: none; }
                .legal-link:hover { text-decoration: underline; }
                .legal-link-muted { color: #6B7280; text-decoration: none; font-weight: 500; }
                .legal-link-muted:hover { text-decoration: underline; }
                .legal-back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #6B7280; text-decoration: none; margin-bottom: 32px; font-weight: 500; }
                .legal-back:hover { color: #374151; }
                .legal-section ul { padding-left: 20px; display: flex; flex-direction: column; gap: 6px; margin: 4px 0; }
                .legal-section li { font-size: 14px; color: #374151; line-height: 1.65; }
                .legal-section p { margin: 0; }
            `}</style>

            <div style={{ maxWidth: 760, margin: "0 auto" }}>

                {/* Back */}
                <Link href="/login" className="legal-back">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Back
                </Link>

                {/* Header */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        background: "#ECFDF5", border: "1px solid #A7F3D0",
                        borderRadius: 20, padding: "4px 14px", marginBottom: 16,
                        fontSize: 11.5, fontWeight: 700, color: "#065F46", letterSpacing: "0.05em",
                    }}>
                        🔒 PRIVACY POLICY
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.7px", margin: "0 0 10px" }}>
                        Your Privacy Matters
                    </h1>
                    <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>
                        This Privacy Policy explains how <strong style={{ color: "#0F172A" }}>Venet</strong>, the operator of Spryon, collects, uses, shares, and protects your information when you use our platform.
                    </p>
                    <p style={{ fontSize: 12.5, color: "#9CA3AF", marginTop: 10 }}>Last updated: {LAST_UPDATED}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                    {/* Company + Data Controller notice */}
                    <div style={{
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        borderRadius: 14, padding: "20px 24px",
                        display: "flex", gap: 14, alignItems: "flex-start",
                    }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>🏢</span>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#92400E", margin: "0 0 6px" }}>
                                Data Controller: Venet
                            </p>
                            <p style={{ fontSize: 13.5, color: "#78350F", lineHeight: 1.6, margin: 0 }}>
                                Spryon is operated by <strong>Venet</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). Venet is the <strong>data controller</strong> responsible for the collection and processing of your personal information as described in this Privacy Policy. All references to &quot;Spryon&quot; in this document refer to the platform operated by Venet. If you have questions about how your data is handled, contact us at <a href="mailto:privacy@spryon.app" className="legal-link">privacy@spryon.app</a>.
                            </p>
                        </div>
                    </div>

                    {/* No Selling banner */}
                    <div style={{
                        background: "#ECFDF5", border: "1px solid #6EE7B7",
                        borderRadius: 14, padding: "16px 24px",
                        display: "flex", gap: 12, alignItems: "center",
                    }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>🚫</span>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#065F46", margin: 0, lineHeight: 1.55 }}>
                            We do not sell, rent, or trade your personal data to any third party — under any circumstances, ever.
                        </p>
                    </div>

                    <Section title="1. Information We Collect">
                        <p>We collect the following categories of information when you use Spryon:</p>
                        <ul>
                            <li><strong>Account Information:</strong> Full name, email address, phone number, and password (stored as a secure hash) when you register.</li>
                            <li><strong>Restaurant Information:</strong> Restaurant name, city, logo, menu items, categories, pricing, and table configurations you create.</li>
                            <li><strong>Payment &amp; Billing Metadata:</strong> We store transaction IDs, subscription status (active/cancelled/expired), plan type, and billing history for your account. <strong>We do not store your card number, bank account details, CVV, or any raw payment credentials.</strong> All card data is handled exclusively by Razorpay.</li>
                            <li><strong>Usage &amp; Analytics Data:</strong> IP address (anonymised), browser/device type, QR scan events, session identifiers, page views, and engagement metrics.</li>
                            <li><strong>Cookies &amp; Local Storage:</strong> Small data files used to maintain your session, authentication state, and platform preferences.</li>
                            <li><strong>Communications:</strong> If you contact our support team, we retain those communications to resolve your query.</li>
                        </ul>
                    </Section>

                    <Section title="2. How We Use Your Information">
                        <p>Venet uses your information to:</p>
                        <ul>
                            <li>Create, authenticate, and manage your Spryon account and restaurant profile.</li>
                            <li>Provide the digital menu, QR code, and analytics services you have subscribed to.</li>
                            <li>Process subscription payments and track billing status via Razorpay.</li>
                            <li>Send essential transactional emails — account verification, OTP codes, password resets, and account approval notifications.</li>
                            <li>Provide restaurant-level analytics on QR scans, menu views, and customer engagement.</li>
                            <li>Detect, investigate, and prevent fraud, abuse, and security incidents.</li>
                            <li>Comply with applicable legal, tax, and regulatory obligations.</li>
                            <li>Improve platform performance, usability, and features using aggregated, anonymised data.</li>
                        </ul>
                        <p>We will not use your data for unsolicited marketing communications without your explicit consent.</p>
                    </Section>

                    <Section title="3. Cookies &amp; Tracking Technologies">
                        <p>We use the following categories of cookies and similar technologies:</p>
                        <ul>
                            <li><strong>Essential / Strictly Necessary:</strong> Required for authentication, session management, and keeping you securely logged in. These cannot be disabled without breaking core platform functionality.</li>
                            <li><strong>Analytics:</strong> Used to understand aggregate usage patterns through Cloudflare Analytics Engine. Data is anonymised — no individual user is personally identified.</li>
                            <li><strong>Preference:</strong> Store your in-app settings and display preferences.</li>
                        </ul>
                        <p><strong>Managing Cookies:</strong> You can control and delete non-essential cookies through:</p>
                        <ul>
                            <li>The cookie consent banner shown on your first visit to the platform.</li>
                            <li>Your browser&apos;s privacy settings (usually under Settings &gt; Privacy &amp; Security &gt; Cookies).</li>
                            <li>Browser extensions that manage cookie permissions.</li>
                        </ul>
                        <p>Disabling analytics cookies will not affect your ability to use the platform. Disabling essential cookies may prevent login and core functions from working correctly.</p>
                    </Section>

                    <Section title="4. Data Sharing">
                        <p><strong>We do not sell your personal data.</strong> We may share your information only with the following categories of recipients, and only to the extent necessary to provide the Service:</p>
                        <ul>
                            <li><strong>Razorpay:</strong> Processes subscription payments on our behalf. Subject to <a href="https://razorpay.com/privacy/" className="legal-link" target="_blank" rel="noopener noreferrer">Razorpay&apos;s Privacy Policy</a>.</li>
                            <li><strong>Cloudflare:</strong> Provides our hosting infrastructure, CDN, DDoS protection, and anonymised analytics. Subject to <a href="https://www.cloudflare.com/privacypolicy/" className="legal-link" target="_blank" rel="noopener noreferrer">Cloudflare&apos;s Privacy Policy</a>.</li>
                            <li><strong>Email delivery providers:</strong> Used to send transactional emails (OTPs, approvals, resets). No marketing data is shared.</li>
                            <li><strong>Legal &amp; regulatory authorities:</strong> Where we are legally compelled to disclose your data by applicable law, court order, or valid government request. We will notify you where legally permitted to do so.</li>
                        </ul>
                        <p><strong>Third-Party Responsibility:</strong> Venet is not responsible for the privacy practices, data handling, or security measures of any third-party service providers. We encourage you to review their respective privacy policies.</p>
                    </Section>

                    <Section title="5. International Data Transfers">
                        <p>Spryon is operated globally using cloud infrastructure. Your data may be stored and processed in data centres outside your country or region of residence, including but not limited to servers operated by Cloudflare across multiple geographic locations.</p>
                        <p>By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your home country. Venet takes reasonable steps to ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection regulations.</p>
                    </Section>

                    <Section title="6. Data Retention">
                        <p>We retain your data only for as long as necessary for the purposes described in this policy:</p>
                        <ul>
                            <li><strong>Active accounts:</strong> All personal data and restaurant content is retained while your account remains active.</li>
                            <li><strong>After account deletion or termination:</strong> Personal data (account details, restaurant content, menus) is permanently deleted within <strong>30 days</strong> of the verified deletion request or termination date.</li>
                            <li><strong>Analytics data:</strong> Aggregated, anonymised QR scan and engagement analytics are retained for up to <strong>12 months</strong> for platform improvement, after which they are permanently purged.</li>
                            <li><strong>Financial &amp; legal records:</strong> Transaction IDs, billing history, and invoices may be retained for up to <strong>7 years</strong> as required by applicable tax and financial regulations.</li>
                            <li><strong>No recovery:</strong> Data deleted after the applicable retention period is permanently unrecoverable. Venet bears no obligation to restore deleted data.</li>
                        </ul>
                    </Section>

                    <Section title="7. Your Rights">
                        <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
                        <ul>
                            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                            <li><strong>Correction:</strong> Update or correct inaccurate data via your account settings or by contacting us.</li>
                            <li><strong>Deletion:</strong> Request permanent deletion of your account and all associated personal data.</li>
                            <li><strong>Portability:</strong> Request your data in a machine-readable, portable format.</li>
                            <li><strong>Objection:</strong> Object to or restrict processing of your data in certain circumstances.</li>
                            <li><strong>Withdrawal of Consent:</strong> Withdraw consent for optional processing (e.g., analytics cookies) at any time.</li>
                        </ul>
                        <p>To exercise any of these rights, contact <a href="mailto:privacy@spryon.app" className="legal-link">privacy@spryon.app</a>. We will respond within 30 days. Note that some rights may be subject to legal limitations.</p>
                    </Section>

                    <Section title="8. Security">
                        <p>Venet implements <strong>industry-standard technical and organisational security measures</strong> to protect your personal data, including:</p>
                        <ul>
                            <li>HTTPS/TLS encryption for all data transmitted to and from the platform.</li>
                            <li>Secure password storage using strong one-way hashing (bcrypt).</li>
                            <li>JWT-based session authentication with short-lived, signed tokens.</li>
                            <li>Cloudflare-backed infrastructure providing DDoS protection and network-level security.</li>
                            <li>Restricted access controls — only authorised personnel can access sensitive data systems.</li>
                        </ul>
                        <p><strong>Important:</strong> No method of electronic transmission or storage is 100% secure. While we use industry-standard practices to protect your data, we cannot guarantee absolute security. If you believe your account has been compromised, contact us immediately at <a href="mailto:security@spryon.app" className="legal-link">security@spryon.app</a>.</p>
                    </Section>

                    <Section title="9. Children's Privacy">
                        <p>Spryon is intended solely for use by adults (18+) operating restaurant businesses. We do not knowingly collect personal information from children under the age of 13. If we become aware that we have inadvertently collected data from a child, we will delete it immediately. If you believe a child has provided us with personal data, contact <a href="mailto:privacy@spryon.app" className="legal-link">privacy@spryon.app</a>.</p>
                    </Section>

                    <Section title="10. Changes to This Policy">
                        <p>Venet may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or the Service. We will notify you of material changes by email or via an in-app notice at least 14 days before the change takes effect. The &quot;Last updated&quot; date at the top of this page will always reflect the most recent revision.</p>
                        <p>Continued use of Spryon after the effective date of changes constitutes your acceptance of the updated Privacy Policy.</p>
                    </Section>

                    <Section title="11. Contact Us">
                        <p>For any questions, concerns, or data requests regarding this Privacy Policy, please contact:</p>
                        <ul>
                            <li>Privacy enquiries: <a href="mailto:privacy@spryon.app" className="legal-link">privacy@spryon.app</a></li>
                            <li>Security reports: <a href="mailto:security@spryon.app" className="legal-link">security@spryon.app</a></li>
                            <li>General support: <a href="mailto:support@spryon.app" className="legal-link">support@spryon.app</a></li>
                            <li>Data Controller: Venet — Operator of Spryon</li>
                        </ul>
                    </Section>

                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 48, paddingTop: 24, borderTop: "1px solid #E4E7EC",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 12,
                }}>
                    <span style={{ fontSize: 12.5, color: "#9CA3AF" }}>© {new Date().getFullYear()} Venet. All rights reserved. Spryon is a product of Venet.</span>
                    <div style={{ display: "flex", gap: 20 }}>
                        <Link href="/terms" className="legal-link" style={{ fontSize: 12.5 }}>Terms of Service</Link>
                        <Link href="/login" className="legal-link-muted" style={{ fontSize: 12.5 }}>Dashboard</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="legal-section" style={{
            background: "white", border: "1px solid #E4E7EC", borderRadius: 14,
            padding: "24px 28px",
        }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 14, letterSpacing: "-0.2px" }}>{title}</h2>
            <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, display: "flex", flexDirection: "column", gap: 10 }}>
                {children}
            </div>
        </div>
    );
}
