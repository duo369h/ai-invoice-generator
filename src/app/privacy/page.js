import Link from "next/link";
import { Logo } from "../components/UIComponents";
import SharedFooter from "../components/SharedFooter";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Corvioz Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
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
                Corvioz collects minimal information to provide public profiles, quote requests, invoices, PDFs, and client portal access. This may include:
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Profile details you customize (avatar URL, bio, portfolio items, services details, rates)</li>
                <li>Client quote requests submitted to your public profile</li>
                <li>Invoice and quote documents you generate in your dashboard</li>
                <li>Browser type and device analytics to optimize layout performance</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                2. How We Use Your Data
              </h2>
              <p>
                Your data is used solely to facilitate your independent business operations. We do not sell, rent, or trade your personal information. Quote requests, invoices, and quotes are securely stored in your personal database profile and shared with clients only when you initiate links or portals.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                3. Cookies & Local Storage
              </h2>
              <p>
                Corvioz uses local storage and cookies to maintain active dashboard sessions, remember preferences, and parse query parameters for profile and quote-request attribution.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                4. Service Providers
              </h2>
              <p>
                Corvioz may use service providers such as Supabase for database storage and PayPal for beta manual billing checks. Corvioz does not access or store your bank details; any payment link you add functions directly through the respective provider.
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
      <SharedFooter />
    </div>
  );
}
