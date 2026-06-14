import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "Freelancer Business OS Terms of Service — rules and guidelines for using our platform.",
};

export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="navbar">
        <div className="logo-container">
          <svg style={{ width: "24px", height: "24px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">Freelancer Business OS</Link>
        </div>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      {/* Content */}
      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <span className="badge" style={{ marginBottom: "16px" }}>Legal</span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px", letterSpacing: "-1px" }}>
            Terms of Service
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "0.95rem" }}>
            Last updated: June 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using Freelancer Business OS (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access the Service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Description of Service
              </h2>
              <p>
                Freelancer Business OS provides a comprehensive independent business operations framework. Users can host a public business card profile, capture inbound client brief requirements, compile proposal milestones, track clearance logs, and settle project invoices.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. User Responsibilities
              </h2>
              <p>You agree to:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Provide accurate information in proposal deliverables and billing line items</li>
                <li>Use the Service in compliance with applicable commercial and tax regulations</li>
                <li>Not use the Service to execute fraudulent checkouts or clear illegal escrow actions</li>
                <li>Not attempt to disrupt dashboard routing security</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Intellectual Property
              </h2>
              <p>
                The Service, its original interface, features, and custom layouts are owned by Freelancer Business OS. Documents, profile assets, and portfolio content you host on the platform are your exclusive property.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Free & Pro Pricing
              </h2>
              <p>
                Freelancer Business OS offers a Free Starter tier and a paid Pro plan at $12 USD per month. Pro access features manual beta verification through PayPal checkouts. Paid users are responsible for listing their username/account email inside payment comments. We reserve the right to alter features and terms with reasonable prior notice.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Payment Links & Invoicing
              </h2>
              <p>
                Invoices generated via Freelancer Business OS display your added payment links (such as Stripe, PayPal, or LemonSqueezy). Freelancer Business OS acts solely as a tracking and logging pipeline to help you manage your business workflow, and does not process, hold, or route financial transactions.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                7. Limitation of Liability
              </h2>
              <p>
                In no event shall Freelancer Business OS be liable for any transaction failures, client payment disputes, or commercial losses resulting from your independent service contracts.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms" style={{ color: "var(--primary)" }}>Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p style={{ marginTop: "12px" }}>© 2026 Freelancer Business OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
