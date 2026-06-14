import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Freelancer Business OS Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "0.95rem" }}>
            Last updated: June 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                1. Information We Collect
              </h2>
              <p>
                Freelancer Business OS collects minimal information to provide our business storefronts, leads CRM, scoping tools, and invoicing. This may include:
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Profile details you customize (avatar URL, bio, portfolio items, services details, rates)</li>
                <li>Client lead inquiries submitted to your public card profile</li>
                <li>Invoice and proposal documents you generate in your dashboard</li>
                <li>Browser type and device analytics to optimize layout performance</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. How We Use Your Data
              </h2>
              <p>
                Your data is used solely to facilitate your independent business operations. We do not sell, rent, or trade your personal information. Leads, invoices, and proposals are securely stored in your personal database profile and shared with clients only when you initiate links or portals.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Cookies & Local Storage
              </h2>
              <p>
                Freelancer Business OS uses local storage and cookies to maintain active dashboard sessions, remember preferences, and parse query parameters (such as UTM parameters for lead attribution tracking).
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Third-Party Integrations
              </h2>
              <p>
                To support advanced features, we secure API routing to third-party endpoints (e.g. Supabase for database storage, PayPal for beta manual billing checks). Freelancer Business OS does not access or store your bank details; any payment link you add (such as Stripe, PayPal, or LemonSqueezy) functions directly through the respective provider.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Data Security
              </h2>
              <p>
                We enforce SSL and secure HTTPS connections for all requests. However, no web transmission model is completely risk-free, and users are responsible for keeping dashboard tokens and credential links safe.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Your Rights
              </h2>
              <p>
                You can manage, alter, or delete any profile parameters inside your user dashboard. For assistance, contact support via our{" "}
                <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  Contact page
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "var(--primary)" }}>Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p style={{ marginTop: "12px" }}>© 2026 Freelancer Business OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
