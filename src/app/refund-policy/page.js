import Link from "next/link";
import { getSupportEmail } from "../lib/config";

export const metadata = {
  title: "Refund Policy",
  description:
    "Freelancer Business OS Refund Policy — how refund requests are handled for Freelancer Business OS Pro payments.",
};

export default function RefundPolicy() {
  const supportEmail = getSupportEmail();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <span className="badge" style={{ marginBottom: "16px" }}>Billing</span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px", letterSpacing: "-1px" }}>
            Refund Policy
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "0.95rem" }}>
            Last updated: June 2026
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                1. Beta Manual Activation
              </h2>
              <p>
                Freelancer Business OS Pro is currently sold through manual PayPal payment requests or PayPal invoices. After payment is verified, our team manually activates Pro access for the customer account.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. Refund Eligibility
              </h2>
              <p>
                If Pro access has not yet been activated, you may request a full refund. If Pro access has already been activated, refund requests are reviewed case by case within 7 days of payment. We may approve a refund if there was a duplicate payment, an activation issue, or a clear billing error.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Non-Refundable Situations
              </h2>
              <p>
                We generally do not provide refunds after substantial use of Pro features, after the refund request window has passed, or when account information provided by the customer was inaccurate and caused a delay in manual activation.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. How to Request a Refund
              </h2>
              <p>
                Email{" "}
                <a href={`mailto:${supportEmail}`} style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  {supportEmail}
                </a>{" "}
                with the subject line &quot;Freelancer Business OS Refund Request&quot;. Please include your Freelancer Business OS username or account email, PayPal transaction ID, payment date, and the reason for the request. We aim to respond within 2 business days.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "30px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        <div className="container" style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy" style={{ color: "var(--primary)" }}>Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p style={{ marginTop: "12px" }}>© 2026 Freelancer Business OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
