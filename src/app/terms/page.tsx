import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service — Spryon",
    description: "The terms and conditions governing your use of the Spryon platform, operated by Venet.",
    icons: { icon: "/favicon-rounded.png" },
};

const LAST_UPDATED = "April 25, 2026";

export default function TermsPage() {
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
                        📄 TERMS OF SERVICE
                    </div>
                    <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.7px", margin: "0 0 10px" }}>
                        Terms of Service
                    </h1>
                    <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65, margin: 0 }}>
                        Please read these Terms carefully before using <strong style={{ color: "#0F172A" }}>Spryon</strong>. By registering or using our platform, you agree to be bound by these terms.
                    </p>
                    <p style={{ fontSize: 12.5, color: "#9CA3AF", marginTop: 10 }}>Last updated: {LAST_UPDATED}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                    {/* Company notice */}
                    <div style={{
                        background: "#FFFBEB", border: "1px solid #FDE68A",
                        borderRadius: 14, padding: "20px 24px",
                        display: "flex", gap: 14, alignItems: "flex-start",
                    }}>
                        <span style={{ fontSize: 22, flexShrink: 0 }}>🏢</span>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#92400E", margin: "0 0 6px" }}>
                                Operated by Venet
                            </p>
                            <p style={{ fontSize: 13.5, color: "#78350F", lineHeight: 1.6, margin: 0 }}>
                                Spryon is a product operated by <strong>Venet</strong> (&quot;the Company&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;). Venet is the legal entity responsible for operating the Spryon platform, entering into these Terms on its behalf, and handling all commercial, legal, and operational obligations. References to &quot;Spryon&quot; in these Terms refer to the platform and service operated by Venet.
                            </p>
                        </div>
                    </div>

                    <Section title="1. Acceptance of Terms">
                        <p>By creating an account or accessing any part of the Spryon platform (&quot;Service&quot;), you confirm that you are at least 18 years old, have the authority to bind the business entity you represent (if applicable), and agree to these Terms of Service and our <a href="/privacy" className="legal-link">Privacy Policy</a>. If you do not agree, you must not use the Service.</p>
                    </Section>

                    <Section title="2. Description of Service">
                        <p>Spryon is a Software-as-a-Service (SaaS) platform that enables restaurant owners and operators to:</p>
                        <ul>
                            <li>Create and manage digital menus accessible via QR codes.</li>
                            <li>Generate unique QR codes for individual restaurant tables.</li>
                            <li>Manage a bio-link style shareable menu page.</li>
                            <li>View analytics on customer engagement, QR scans, and menu views.</li>
                            <li>Manage subscription plans and billing.</li>
                        </ul>
                        <p>Venet reserves the right to modify, suspend, or discontinue any feature at any time with reasonable notice where practicable. We will endeavour to notify users of material changes via email or in-app notice.</p>
                    </Section>

                    <Section title="3. Account Registration">
                        <p>To use Spryon, you must register for an account. You agree to:</p>
                        <ul>
                            <li>Provide accurate, current, and complete information during registration.</li>
                            <li>Keep your password confidential and notify us immediately of any unauthorised access at <a href="mailto:support@spryon.app" className="legal-link">support@spryon.app</a>.</li>
                            <li>Be solely responsible for all activity conducted under your account.</li>
                            <li>Not create multiple accounts to circumvent bans, restrictions, or plan limits.</li>
                        </ul>
                        <p>All new accounts are subject to verification and approval by the Spryon team before full access is granted. Venet reserves the right to refuse registration at its sole discretion.</p>
                    </Section>

                    <Section title="4. Subscriptions, Billing &amp; Taxes">
                        <p>Access to certain features requires an active paid subscription:</p>
                        <ul>
                            <li>Subscription fees are billed on a monthly or annual basis as specified in your chosen plan.</li>
                            <li>Payments are processed securely via <strong>Razorpay</strong>. Neither Spryon nor Venet stores your payment card or bank account details.</li>
                            <li>Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date.</li>
                            <li>Upon cancellation, you retain access until the end of the current paid billing period only.</li>
                            <li>After expiry or non-renewal, your account will be restricted and your public QR menus will be suspended.</li>
                        </ul>
                        <p><strong>Refund Policy — No Exceptions:</strong> All subscription fees are <strong>strictly non-refundable</strong>. This includes but is not limited to:</p>
                        <ul>
                            <li>No prorated refunds for unused time within a billing period.</li>
                            <li>No refunds after a subscription has been renewed.</li>
                            <li>No refunds for unused features, downtime, or service interruptions.</li>
                            <li>No refunds when downgrading to a lower-tier plan.</li>
                            <li>No refunds if your account is suspended or terminated due to a violation of these Terms.</li>
                        </ul>
                        <p><strong>Taxes (GST &amp; Other Duties):</strong> Quoted prices may exclude applicable taxes, including Goods and Services Tax (GST) or other local levies. You are solely responsible for determining and paying all applicable taxes, duties, and levies associated with your use of the Service. Venet may add applicable taxes to invoices as required by law.</p>
                    </Section>

                    <Section title="5. Acceptable Use">
                        <p>You agree not to use Spryon to:</p>
                        <ul>
                            <li>Upload or distribute illegal, defamatory, abusive, obscene, or fraudulent content.</li>
                            <li>Impersonate any person, restaurant, or entity.</li>
                            <li>Display <strong>false or misleading menu pricing</strong> that may deceive customers.</li>
                            <li>List illegal food items, controlled substances, or services prohibited by applicable law.</li>
                            <li>Use copyrighted menu descriptions, images, or logos without proper authorisation or licence from the rights holder.</li>
                            <li>Interfere with, disrupt, or attempt to gain unauthorised access to the platform or other users&apos; accounts.</li>
                            <li>Use automated tools (bots, scrapers, crawlers) to extract data from the platform without written consent.</li>
                            <li>Resell, sublicense, or white-label access to the Service without Venet&apos;s prior written permission.</li>
                            <li>Circumvent any technical limitations, rate limits, or security measures.</li>
                        </ul>
                        <p>Violation of these rules may result in immediate suspension or permanent termination of your account without refund, and may be reported to relevant authorities.</p>
                    </Section>

                    <Section title="6. Content Ownership &amp; Licence">
                        <p><strong>Your Content:</strong> You retain full ownership of all content you upload to Spryon (menus, images, logos, descriptions). By uploading content, you grant Venet a limited, non-exclusive, royalty-free, worldwide licence to host, store, display, and serve that content solely to provide the Service to you and your customers.</p>
                        <p><strong>Your Responsibility:</strong> You represent and warrant that you own or have the necessary rights to all content you upload, and that it does not infringe any third-party intellectual property rights, applicable laws, or these Terms.</p>
                        <p><strong>Our Content:</strong> All platform design, code, branding, trademarks, and documentation are the exclusive property of Venet. You may not copy, modify, reverse-engineer, or distribute any part of the platform without prior written permission.</p>
                    </Section>

                    <Section title="7. Indemnification">
                        <p>You agree to <strong>indemnify, defend, and hold harmless</strong> Venet, Spryon, and their respective officers, directors, employees, contractors, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or relating to:</p>
                        <ul>
                            <li>Your use of the Service or any breach of these Terms.</li>
                            <li>Content you upload, including menus, images, pricing, descriptions, or any material that infringes third-party rights.</li>
                            <li>Misleading, false, or illegal menu items or pricing displayed through your account.</li>
                            <li>Any claim by a customer, employee, supplier, or regulatory body related to your restaurant&apos;s use of Spryon.</li>
                            <li>Your violation of any applicable law, regulation, or third-party right.</li>
                        </ul>
                        <p>Venet reserves the right, at your expense, to assume exclusive defence and control of any matter subject to indemnification, and you agree to cooperate fully with such defence.</p>
                    </Section>

                    <Section title="8. Account Status &amp; Moderation">
                        <p>Venet reserves the right to:</p>
                        <ul>
                            <li><strong>Pending:</strong> Place new accounts in a pending state while verifying business legitimacy and information.</li>
                            <li><strong>Suspend:</strong> Temporarily restrict access for suspected policy violations, billing issues, or investigation.</li>
                            <li><strong>Terminate:</strong> Permanently close accounts for serious, repeated, or severe violations of these Terms.</li>
                        </ul>
                        <p>You may appeal a suspension or termination by contacting <a href="mailto:support@spryon.app" className="legal-link">support@spryon.app</a>. Venet&apos;s decision following appeal is final.</p>
                    </Section>

                    <Section title="9. User-Initiated Account Termination">
                        <p>You may request deletion of your Spryon account at any time by:</p>
                        <ul>
                            <li>Emailing <a href="mailto:support@spryon.app" className="legal-link">support@spryon.app</a> with the subject line &quot;Account Deletion Request&quot;.</li>
                            <li>Submitting a deletion request through the account settings (where available).</li>
                        </ul>
                        <p>Upon verified deletion request, your account access will be revoked and your personal data (menus, restaurant profile, account information) will be permanently deleted within <strong>30 days</strong>, subject to any legal retention requirements. <strong>Deleted data cannot be recovered.</strong></p>
                        <p>Termination does not entitle you to any refund for the remaining billing period. Active subscriptions must be separately cancelled with your payment provider to avoid future charges.</p>
                    </Section>

                    <Section title="10. Data Deletion After Termination">
                        <p>Whether your account is terminated by you or by Venet:</p>
                        <ul>
                            <li>Your personal data and restaurant content will be deleted within <strong>30 days</strong> of the effective termination date.</li>
                            <li>Aggregate or anonymised analytics data may be retained for up to 12 months for platform improvement purposes.</li>
                            <li>Data required to be retained for legal, regulatory, or financial compliance purposes will be kept for the minimum period required by applicable law.</li>
                            <li><strong>Deleted data is permanently unrecoverable.</strong> Venet bears no obligation to retain or restore data after deletion.</li>
                        </ul>
                    </Section>

                    <Section title="11. Third-Party Services &amp; Dependencies">
                        <p>The Service relies on third-party providers including, but not limited to, Razorpay (payments), Cloudflare (hosting, CDN, and analytics), and email delivery providers. You acknowledge and agree that:</p>
                        <ul>
                            <li>Venet is <strong>not responsible</strong> for failures, outages, data breaches, or errors caused by any third-party service provider.</li>
                            <li>Third-party services are governed by their own terms and privacy policies, and Venet does not control or warrant their availability or accuracy.</li>
                            <li>Payment failures or disputes must be addressed directly with Razorpay under their terms.</li>
                            <li>Venet will take reasonable steps to mitigate the impact of third-party failures but makes no guarantee of continuity.</li>
                        </ul>
                    </Section>

                    <Section title="12. Service Availability &amp; Downtime">
                        <p>Venet does not provide any uptime guarantee or service level agreement (SLA) unless separately agreed in writing. You acknowledge that:</p>
                        <ul>
                            <li>The Service may experience interruptions due to maintenance, updates, technical failures, third-party outages, or other unforeseen events.</li>
                            <li>Venet is <strong>not liable</strong> for any business losses, lost revenue, missed orders, customer complaints, or reputational damage resulting from Service downtime or unavailability.</li>
                            <li>We will provide reasonable advance notice of planned maintenance where possible.</li>
                        </ul>
                    </Section>

                    <Section title="13. Force Majeure">
                        <p>Venet shall not be liable for any delay or failure to perform its obligations under these Terms where such failure results from causes beyond our reasonable control, including but not limited to:</p>
                        <ul>
                            <li>Acts of God, natural disasters, floods, fires, or earthquakes.</li>
                            <li>War, terrorism, civil unrest, or government actions.</li>
                            <li>Internet or telecommunications infrastructure failures.</li>
                            <li>Pandemic, epidemic, or public health emergencies.</li>
                            <li>Regulatory changes, embargoes, or sanctions.</li>
                            <li>Third-party supplier or data centre failures outside our direct control.</li>
                        </ul>
                        <p>In such events, our obligations will be suspended for the duration of the force majeure, and we will notify affected users as soon as reasonably practicable.</p>
                    </Section>

                    <Section title="14. Disclaimer of Warranties">
                        <p>The Service is provided <strong>&quot;as is&quot;</strong> and <strong>&quot;as available&quot;</strong> without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.</p>
                        <p>Venet does not warrant that the Service will be uninterrupted, error-free, virus-free, or that any defects will be corrected. Use of the Service is entirely at your own risk.</p>
                    </Section>

                    <Section title="15. Limitation of Liability">
                        <p>To the maximum extent permitted by applicable law, Venet and its officers, directors, employees, and agents shall not be liable for any:</p>
                        <ul>
                            <li>Indirect, incidental, special, consequential, or punitive damages.</li>
                            <li>Loss of profits, revenue, data, goodwill, customers, or business opportunities.</li>
                            <li>Losses arising from your reliance on the Service for critical business operations.</li>
                        </ul>
                        <p>Our total aggregate liability to you for any claims arising from or related to these Terms shall not exceed the total amount you paid to Venet in the <strong>3 months immediately preceding</strong> the event giving rise to the claim.</p>
                    </Section>

                    <Section title="16. Governing Law &amp; Dispute Resolution">
                        <p>These Terms are governed by and construed in accordance with the laws of <strong>India</strong>, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
                        <p>If you are using the Service outside India, you remain responsible for compliance with your applicable local laws and regulations.</p>
                    </Section>

                    <Section title="17. Changes to Terms">
                        <p>Venet may update these Terms at any time. We will notify you of significant changes by email or in-app notice at least <strong>14 days before</strong> they take effect, except where required by law to act sooner. Continued use of the Service after the effective date of changes constitutes your acceptance of the updated Terms.</p>
                        <p>If you do not agree to the updated Terms, you must cease using the Service and may request account deletion as described in Section 9.</p>
                    </Section>

                    <Section title="18. Contact">
                        <p>For questions about these Terms, please contact:</p>
                        <ul>
                            <li>Legal enquiries: <a href="mailto:legal@spryon.app" className="legal-link">legal@spryon.app</a></li>
                            <li>General support: <a href="mailto:support@spryon.app" className="legal-link">support@spryon.app</a></li>
                            <li>Company: Venet — Operator of Spryon</li>
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
                        <Link href="/privacy" className="legal-link" style={{ fontSize: 12.5 }}>Privacy Policy</Link>
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
