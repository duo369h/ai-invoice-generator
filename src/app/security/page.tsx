import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';
import LegalPageMeta from '../components/LegalPageMeta';

export const metadata = {
  title: 'Security Center | Corvioz',
  description: 'How Corvioz protects freelancer invoices, client data, usage data, authentication, and Paddle billing.',
};

const sections = [
  {
    title: 'Infrastructure Security',
    body: 'Corvioz is served over HTTPS and runs in a secure hosted environment. Browser communication is encrypted in transit, and production delivery is designed around secure web transport rather than unencrypted document exchange.',
  },
  {
    title: 'Data Security',
    body: 'Invoices, quotes, proposals, client records, and usage data are stored through managed application infrastructure and protected with access controls appropriate for a SaaS workspace. We treat client and billing workflow data as private business records.',
  },
  {
    title: 'Authentication',
    body: 'Corvioz uses a secure login system with managed authentication and session handling. User access is scoped to the signed-in account and workspace context.',
  },
  {
    title: 'Billing Security',
    body: 'Subscription payments are processed by Paddle where checkout is enabled. Corvioz does not store raw card numbers on its own servers, and Paddle handles checkout, receipts, tax handling, and billing records where applicable.',
  },
  {
    title: 'Data Protection Principles',
    body: 'We use least-privilege access principles for internal operations. Access to production data is limited to what is necessary to operate, support, and improve Corvioz.',
  },
  {
    title: 'Responsible Disclosure',
    body: 'If you believe you have found a vulnerability, email security@corvioz.com with the affected page, reproduction steps, and potential impact. We review responsible reports and prioritize issues that could affect account, client, invoice, or billing data.',
  },
];

export default function SecurityPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <PublicHeader route="/security" surfaceId="security-public-header" logoSize={24} />

      <section className="container" style={{ maxWidth: '920px', margin: '0 auto', padding: '72px 24px 42px' }}>
        <LegalPageMeta
          badge="Security Center"
          title="How Corvioz protects your client workflow"
          description="Corvioz is built for freelancers who depend on quotes, proposals, invoices, client records, and payment workflows. This page explains the security practices we use without claiming certifications we have not implemented."
        />
      </section>

      <section className="container" style={{ maxWidth: '920px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {sections.map((section, index) => (
            <article key={section.title} className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {String(index + 1).padStart(2, '0')}
              </p>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800 }}>
                {section.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800 }}>
            Trust and data ownership
          </h2>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Security is one part of trust. Corvioz also keeps its data ownership promise clear: your invoices, client data, and exported documents remain yours.
          </p>
          <Link href="/trust" className="btn btn-secondary btn-sm">
            Why Trust Corvioz
          </Link>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
