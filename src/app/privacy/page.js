import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "InvoiceAI Privacy Policy — how we collect, use, and protect your data.",
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
          <Link href="/">InvoiceAI</Link>
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
                InvoiceAI collects minimal information to provide our invoice and receipt generation service. This may include:
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Invoice and receipt content you enter (client names, amounts, descriptions)</li>
                <li>Browser type and device information for analytics</li>
                <li>Usage data to improve our AI parsing accuracy</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. How We Use Your Data
              </h2>
              <p>
                Your data is used solely to generate invoices, receipts, and PDF documents as requested.
                We do not sell, rent, or trade your personal information to third parties.
                Invoice data processed through our AI engine is used only for the current session and is not stored permanently unless you explicitly save it.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Cookies & Local Storage
              </h2>
              <p>
                InvoiceAI may use cookies and local storage to remember your preferences (such as language settings).
                We use minimal analytics cookies to understand usage patterns and improve our service.
                You can disable cookies through your browser settings at any time.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Third-Party Services
              </h2>
              <p>
                Our AI-powered parsing feature sends text data to DeepSeek&apos;s API for processing.
                This data is transmitted securely and is subject to DeepSeek&apos;s privacy policy.
                We may also use PayPal to process Pro plan payments during the beta period. Payment
                details are handled by PayPal; InvoiceAI only uses payment confirmation information
                to verify and activate Pro access.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Data Security
              </h2>
              <p>
                We implement industry-standard security measures to protect your data.
                All data transmission is encrypted via HTTPS. However, no method of electronic
                transmission or storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Your Rights
              </h2>
              <p>
                You have the right to access, correct, or delete your personal data at any time.
                To exercise these rights, please contact us at the email address provided on our{" "}
                <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  Contact page
                </Link>.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                7. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. Any changes will be posted on this page
                with an updated revision date. We encourage you to review this page periodically.
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
        <p style={{ marginTop: "12px" }}>© 2026 InvoiceAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
