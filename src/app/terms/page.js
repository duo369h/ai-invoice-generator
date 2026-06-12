import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
  description:
    "InvoiceAI Terms of Service — rules and guidelines for using our platform.",
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
                By accessing and using InvoiceAI (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the Service.
                These terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Description of Service
              </h2>
              <p>
                InvoiceAI provides an AI-powered invoice and receipt generation platform.
                Users can create, edit, and export professional financial documents.
                The Service includes AI text parsing, manual document creation, and PDF export functionality.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. User Responsibilities
              </h2>
              <p>You agree to:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Provide accurate information when creating invoices and receipts</li>
                <li>Use the Service only for lawful purposes and in compliance with applicable laws</li>
                <li>Not use the Service to generate fraudulent or misleading financial documents</li>
                <li>Not attempt to disrupt or compromise the security of the Service</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Intellectual Property
              </h2>
              <p>
                The Service, its original content, features, and functionality are owned by InvoiceAI
                and are protected by international copyright, trademark, and other intellectual property laws.
                Documents you create using the Service are your own property.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Free & Premium Plans
              </h2>
              <p>
                InvoiceAI offers a free tier with limited features. Premium plans with additional
                capabilities will be available in the future. We reserve the right to modify
                pricing and plan features with reasonable notice to users.
                Payment processing features are currently in development and will be announced when available.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Disclaimer of Warranties
              </h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                either express or implied. InvoiceAI does not guarantee that the Service will be
                uninterrupted, error-free, or free of harmful components. The AI-generated content
                should be reviewed for accuracy before use in any official capacity.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                7. Limitation of Liability
              </h2>
              <p>
                In no event shall InvoiceAI be liable for any indirect, incidental, special,
                consequential, or punitive damages, including but not limited to loss of profits,
                data, or business opportunities, arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                8. Changes to Terms
              </h2>
              <p>
                We reserve the right to modify these terms at any time. We will provide notice of
                significant changes by posting the new Terms on this page with an updated date.
                Continued use of the Service after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                9. Contact
              </h2>
              <p>
                If you have any questions about these Terms, please contact us through our{" "}
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
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms" style={{ color: "var(--primary)" }}>Terms of Service</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p style={{ marginTop: "12px" }}>© 2026 InvoiceAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
