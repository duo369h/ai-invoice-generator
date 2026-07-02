import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Why Trust Corvioz | Corvioz',
  description: 'Why freelancers can trust Corvioz with quotes, proposals, client documents, client data, secure checkout, privacy, and product transparency.',
};

const trustSections = [
  {
    title: 'Product Philosophy',
    body: 'Corvioz is built for freelancers who need a focused client workflow: quote the work, clarify the proposal, prepare client documents, and keep the client relationship organized.',
  },
  {
    title: 'Data Ownership',
    body: 'You own your quotes, proposals, client records, and exported documents. Corvioz exists to help you manage that work, not to take ownership of it.',
  },
  {
    title: 'Transparency',
    body: 'Paid plan checkout is handled securely by Paddle where enabled. Corvioz keeps plan messaging clear, avoids hidden fees, and supports cancellation before renewal.',
  },
  {
    title: 'Privacy Commitment',
    body: 'We do not sell personal data. Product analytics are used to understand and improve the Corvioz experience, not to package personal client records for resale.',
  },
  {
    title: 'Security Summary',
    body: 'Corvioz uses secure web transport, managed authentication, scoped access patterns, and Paddle as the secure checkout provider so freelancers can run client workflows with a clearer trust boundary.',
  },
  {
    title: 'Founder Message',
    body: 'Corvioz exists because freelancers should not need heavy CRM or accounting systems just to look professional, quote clearly, prepare client documents, and keep delivery organized.',
  },
  {
    title: 'Building Corvioz in Public',
    body: 'Corvioz evolves through real freelancer feedback. Product improvements are driven by customer experience, and transparency is a long-term commitment.',
  },
  {
    title: 'Our Principles',
    body: 'Simplicity over complexity. Your data belongs to you. Workflow clarity before busywork. Transparent pricing. Continuous improvement.',
  },
  {
    title: 'Help Shape Corvioz',
    body: 'Send feedback to support@corvioz.com. We listen closely to freelancer questions, workflow friction, and trust concerns as Corvioz improves.',
  },
];

export default function TrustPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <PublicHeader route="/trust" surfaceId="trust-public-header" logoSize={24} />

      <section className="container" style={{ maxWidth: '940px', margin: '0 auto', padding: '72px 24px 42px' }}>
        <p className="section-kicker">Why Trust Corvioz</p>
        <h1 className="section-title" style={{ marginBottom: '16px' }}>
          Built for freelancers who need clear, trustworthy client work
        </h1>
        <p className="section-lede" style={{ maxWidth: '760px' }}>
          Corvioz is designed around a simple promise: help freelancers move from client request to quote, proposal, client document, and delivery record without hiding data ownership, plan terms, or privacy terms.
        </p>
      </section>

      <section className="container" style={{ maxWidth: '940px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {trustSections.map((section) => (
            <article key={section.title} className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>
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
            Security details
          </h2>
          <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            For the practical security controls behind Corvioz, review the Security Center.
          </p>
          <Link href="/security" className="btn btn-secondary btn-sm">
            Open Security Center
          </Link>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
