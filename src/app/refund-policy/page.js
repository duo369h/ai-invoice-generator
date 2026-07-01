import Link from "next/link";
import SharedFooter from "../components/SharedFooter";
import { refundPolicy } from "../../legal/refund-policy";
import PublicHeader from "../components/PublicHeader";
import LegalPageMeta from "../components/LegalPageMeta";

export const metadata = {
  title: "Refund Policy",
  description:
    "Corvioz Refund Policy — how refund requests are handled for Corvioz Pro payments.",
};

export default function RefundPolicy() {
  const supportEmail = refundPolicy.supportEmail;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader route="/refund-policy" surfaceId="refund-public-header" logoSize={24} />

      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <LegalPageMeta badge="Billing" title="Refund Policy" description={refundPolicy.summary} />

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {refundPolicy.sections.map((section, index) => (
              <section key={section.title}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                  {index + 1}. {section.title}
                </h2>
                <p>{section.body}</p>
                <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {section.items.map((item) => (
                    <li key={item}>
                      {item.includes(supportEmail) ? (
                        <>
                          {item.split(supportEmail)[0]}
                          <a href={`mailto:${supportEmail}`} style={{ color: "var(--primary)", textDecoration: "underline" }}>{supportEmail}</a>
                          {item.split(supportEmail)[1]}
                        </>
                      ) : item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {refundPolicy.sections.length + 1}. Refund FAQ
              </h2>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <li><strong style={{ color: "var(--text-main)" }}>Can I cancel anytime?</strong> Yes. You can cancel future renewal through account billing support or Paddle where enabled.</li>
                <li><strong style={{ color: "var(--text-main)" }}>How long do refunds take?</strong> Approved refunds are coordinated through Paddle. Processing time can vary by payment method and bank.</li>
                <li><strong style={{ color: "var(--text-main)" }}>Do I lose my invoices?</strong> No. Your invoices, quotes, client records, and exported documents remain your business records according to the Privacy Policy and Terms.</li>
                <li><strong style={{ color: "var(--text-main)" }}>Can I export my data?</strong> Yes. You can request account and workspace data export through support, subject to identity verification.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}
