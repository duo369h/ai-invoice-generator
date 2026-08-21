import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Why Trust Corvioz | Corvioz',
  description: 'Why freelancers can trust Corvioz with quotes, invoices, client documents, client data, subscription checkout, privacy, and product transparency.',
};

const trustSections = [
  {
    title: 'Product Philosophy',
    body: 'Corvioz is built for freelancers who need a focused client workflow: quote the work, prepare invoices and client documents, and keep the client relationship organized.',
  },
  {
    title: 'Data Ownership',
    body: 'You own your quotes, invoices, client records, and exported documents. Corvioz exists to help you manage that work, not to take ownership of it.',
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
    body: 'Corvioz uses secure web transport, managed authentication, and scoped access patterns. Subscriptions are securely handled through Paddle.',
  },
  {
    title: 'Founder Message',
    body: 'Corvioz exists because freelancers should not need heavy CRM or accounting systems just to look professional, quote clearly, prepare client documents, and keep delivery organized.',
  },
  {
    title: 'Building Corvioz in Public',
    body: 'Corvioz evolves through real photographer feedback. Product improvements are driven by customer experience, and transparency is a long-term commitment.',
  },
  {
    title: 'Our Principles',
    body: 'Simplicity over complexity. Your data belongs to you. Workflow clarity before busywork. Transparent pricing. Continuous improvement.',
  },
  {
    title: 'Help Shape Corvioz',
    body: 'Send feedback to support@corvioz.com. We listen closely to photographer questions, product friction, and trust concerns as Corvioz improves.',
  },
];

export default function TrustPage() {
  return (
    <main className="resource-page">
      <PublicHeader route="/trust" surfaceId="trust-public-header" logoSize={24} />

      <section className="container resource-page__intro resource-page__intro--standard">
        <p className="section-kicker">Why Trust Corvioz</p>
        <h1 className="section-title resource-page__title">
          Built for freelancers who need clear, trustworthy client work
        </h1>
        <p className="section-lede resource-page__lede">
          Corvioz is designed around a simple promise: help freelancers move from client request to quote, invoice, client document, and delivery record without hiding data ownership, plan terms, or privacy terms.
        </p>
      </section>

      <section className="container resource-page__content resource-page__content--standard">
        <div className="resource-page__grid">
          {trustSections.map((section) => (
            <article key={section.title} className="card resource-page__card">
              <h2 className="resource-page__card-title">
                {section.title}
              </h2>
              <p className="resource-page__card-copy resource-page__trust-card-copy">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="card resource-page__card resource-page__security-card">
          <h2 className="resource-page__card-title resource-page__security-title">
            Security details
          </h2>
          <p className="resource-page__card-copy resource-page__security-copy">
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
