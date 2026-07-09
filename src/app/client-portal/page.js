import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Client Portal | Corvioz',
  description: 'External client portal entry for shared Corvioz quote and invoice review links.',
};

export default function ClientPortalPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <PublicHeader route="/client-portal" surfaceId="client-portal-public-header" logoSize={24} />

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '72px 24px 42px' }}>
        <p className="section-kicker">Client Portal</p>
        <h1 className="section-title" style={{ marginBottom: '16px' }}>
          External review pages for your clients
        </h1>
        <p className="section-lede" style={{ maxWidth: '760px' }}>
          Client Portal is separate from your internal Clients database. Use it for the private links clients open to review shared quotes, invoices, documents, and project updates.
        </p>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px' }}>
          {[
            {
              title: 'Internal Clients',
              body: 'Your CRM-style client records live inside the dashboard under Clients.',
            },
            {
              title: 'External Portal',
              body: 'Private portal links are generated from individual quotes and invoices when you share them.',
            },
            {
              title: 'Secure Links',
              body: 'Existing portal links continue to resolve through the tokenized /portal routes.',
            },
          ].map((item) => (
            <div key={item.title} className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800 }}>
                {item.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800 }}>
              Need to manage client records?
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Go to Clients for internal history, notes, and records. Stay here only when you mean the external client-facing portal.
            </p>
          </div>
          <Link href="/dashboard?tool=client" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Open Clients
          </Link>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
