import Link from "next/link";
import { Logo } from "../components/UIComponents";
import SharedFooter from "../components/SharedFooter";

export const metadata = {
  title: "Terms of Service",
  description:
    "Corvioz Terms of Service — rules and guidelines for using our platform.",
};

export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="navbar">
        <Logo size={24} />
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
                By accessing and using Corvioz (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access the Service.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Description of Service
              </h2>
              <p>
                Corvioz provides lightweight freelancer business tools. Users can host a public profile, create quotes, create invoices, export PDFs, share client portal links, and track payment status.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. User Responsibilities
              </h2>
              <p>You agree to:</p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Provide accurate information in quote, invoice, and billing line items</li>
                <li>Use the Service in compliance with applicable commercial and tax regulations</li>
                <li>Not use the Service to execute fraudulent checkouts or illegal payment activity</li>
                <li>Not attempt to disrupt dashboard routing security</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Intellectual Property
              </h2>
              <p>
                The Service, its original interface, features, and custom layouts are owned by Corvioz. Documents, profile assets, and portfolio content you host on the platform are your exclusive property.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                5. Pricing
              </h2>
              <p>
                Corvioz offers a Free tier and paid plans (Pro and Studio). Current plan pricing and features are always listed on the{' '}
                <a href="/pricing" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Pricing page</a>.
                Roadmap features may be listed as coming soon, but they are not part of the current V1 launch scope. Paid features may be activated manually while automated billing is finalized. We reserve the right to alter features and terms with reasonable prior notice.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                6. Payment Links & Invoicing
              </h2>
              <p>
                Invoices generated via Corvioz can display your added payment links, such as Paddle, PayPal, or a bank-transfer instruction. Corvioz helps you create documents and track payment status, but does not process, hold, or route financial transactions unless a future payment processor integration is explicitly enabled.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                7. Limitation of Liability
              </h2>
              <p>
                In no event shall Corvioz be liable for any transaction failures, client payment disputes, or commercial losses resulting from your independent service contracts.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
}
