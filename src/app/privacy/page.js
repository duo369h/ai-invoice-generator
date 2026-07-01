import Link from "next/link";
import SharedFooter from "../components/SharedFooter";
import PublicHeader from "../components/PublicHeader";
import { privacyPolicy } from "../../legal/privacy-policy";
import { thirdPartyDisclosures } from "../../legal/thirdPartyDisclosure";
import { dataHandlingMap } from "../../legal/dataMap";
import { complianceRights } from "../../legal/complianceRights";
import LegalPageMeta from "../components/LegalPageMeta";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Corvioz Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader route="/privacy" surfaceId="privacy-public-header" logoSize={24} />

      {/* Content */}
      <main className="container" style={{ flex: 1, padding: "60px 24px", maxWidth: "800px", margin: "0 auto" }}>
        <div className="animate-fade-in">
          <LegalPageMeta title="Privacy Policy" description={privacyPolicy.summary} />

          <div style={{ display: "flex", flexDirection: "column", gap: "32px", lineHeight: 1.8, color: "var(--text-muted)", fontSize: "0.95rem" }}>
            {privacyPolicy.sections.map((section, index) => (
              <section key={section.title}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {index + 1}. {section.title}
                </h2>
                <p>{section.body}</p>
                <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ))}

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {privacyPolicy.sections.length + 1}. Third-party processors
              </h2>
              <p>Corvioz uses third-party providers only to operate the SaaS product, process payments, store data, or measure product performance.</p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {thirdPartyDisclosures.map((provider) => (
                  <li key={provider.key}>
                    <strong style={{ color: "var(--text-main)" }}>{provider.name}:</strong> {provider.purpose}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {privacyPolicy.sections.length + 2}. Data handling map
              </h2>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {dataHandlingMap.map((entry) => (
                  <li key={entry.category}>
                    <strong style={{ color: "var(--text-main)" }}>{entry.category}:</strong> stored in {entry.storageLocation} Used to {entry.purpose.toLowerCase()}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {privacyPolicy.sections.length + 3}. GDPR and CCPA requests
              </h2>
              <p>
                You can request access, correction, export, or deletion of your data. We verify account ownership before completing privacy requests.
                For assistance, contact support via our{" "}
                <Link href="/contact" style={{ color: "var(--primary)", textDecoration: "underline" }}>
                  Contact page
                </Link>.
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {[...complianceRights.gdpr.rights, ...complianceRights.ccpa.rights.slice(0, 2)].map((right) => <li key={right}>{right}</li>)}
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "12px" }}>
                {privacyPolicy.sections.length + 4}. Retention after deletion
              </h2>
              <p>
                When an account is deleted, Corvioz removes or de-identifies account workspace data where legally permitted. Some records may be retained for a limited period when required for billing, tax, fraud prevention, security, dispute handling, or legal compliance.
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Billing and Paddle records may be retained according to payment, tax, and accounting requirements.</li>
                <li>Security and abuse-prevention logs may be retained for operational protection.</li>
                <li>Aggregated analytics may be retained without directly identifying a user.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <SharedFooter />
    </div>
  );
}
