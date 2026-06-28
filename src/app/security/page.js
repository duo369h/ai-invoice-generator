import Link from "next/link";
import { Logo } from "../components/UIComponents";
import SharedFooter from "../components/SharedFooter";

export const metadata = {
  title: "Security & Data Protection | Corvioz",
  description: "How Corvioz secures your freelance business database, client data, and invoice assets.",
};

export default function SecurityPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-page)", color: "var(--text-main)", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <header className="navbar">
        <Logo size={24} />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      {/* Content */}
      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <span className="badge" style={{ marginBottom: "16px", background: "var(--primary-glow)", color: "var(--primary)", border: "1px solid var(--primary)", padding: "4px 12px", borderRadius: "99px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Security</span>
          
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "8px", letterSpacing: "-1px", color: "var(--text-main)" }}>
            Security &amp; Data Protection
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "40px", fontSize: "0.95rem" }}>
            Last updated: June 2026
          </p>

          <p style={{ fontSize: "1.1rem", lineHeight: 1.6, color: "var(--text-soft)", marginBottom: "40px" }}>
            We believe your freelance billing and client data should be private, secure, and entirely under your own control. Here is how we build and run Corvioz to protect your business assets.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "40px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            <section style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                1. Infrastructure &amp; Encryption
              </h2>
              <p style={{ marginBottom: "8px" }}>
                <strong>Data Encryption:</strong> All user and business data is encrypted at rest using industry-standard AES-256 keys, and encrypted in transit via SSL/TLS secure HTTPS protocols.
              </p>
              <p>
                <strong>Secure Backend:</strong> We host our database with <strong>Supabase</strong>, powered by PostgreSQL security controls. Physical server infrastructure is secured and maintained in enterprise-grade data centers.
              </p>
            </section>

            <section style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                2. Hosting &amp; Delivery Network
              </h2>
              <p>
                Corvioz is hosted and deployed globally using <strong>Vercel</strong>. Vercel provides DDoS protection, secure static builds, and automated edge routing to guarantee maximum availability and secure document delivery for you and your clients.
              </p>
            </section>

            <section style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                3. Privacy &amp; Data Ownership
              </h2>
              <p style={{ marginBottom: "8px" }}>
                <strong>Your Data is Yours:</strong> We do not sell, rent, trade, or distribute your business profiles, client details, proposals, or invoice files to third parties.
              </p>
              <p>
                <strong>No AI Training:</strong> We use AI models solely for on-demand document generation at your direct request. We <strong>never</strong> use your uploaded files, client details, or generated documents to train underlying language models.
              </p>
            </section>

            <section style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                4. Absolute Control &amp; Deletion
              </h2>
              <p style={{ marginBottom: "8px" }}>
                <strong>Content Ownership:</strong> You own 100% of all generated quotes, client portals, and invoice records.
              </p>
              <p>
                <strong>Right to Delete:</strong> You can modify or delete your account records, clients lists, and estimates at any time inside your dashboard. Once deleted, your files are permanently scrubbed from our active databases.
              </p>
            </section>

            <section style={{ borderLeft: "3px solid var(--primary)", paddingLeft: "20px", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "10px" }}>
                Need Help or Have Questions?
              </h2>
              <p>
                If you have security questions or wish to request immediate data export assistance, please contact us anytime through our{" "}
                <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline", fontWeight: 600 }}>
                  Contact Page
                </Link> or email us at <strong>security@corvioz.com</strong>.
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
