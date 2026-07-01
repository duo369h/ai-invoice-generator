import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Help Center | Corvioz',
  description: 'One place for Corvioz contact, privacy, terms, refund, security, trust, and future documentation resources.',
};

const helpLinks = [
  { title: 'Contact', href: '/contact', body: 'Get help, send feedback, or ask a question about your Corvioz account.' },
  { title: 'Privacy Policy', href: '/privacy', body: 'Understand what data Corvioz collects and how it is used.' },
  { title: 'Terms of Service', href: '/terms', body: 'Review the rules and responsibilities for using Corvioz.' },
  { title: 'Refund Policy', href: '/refund-policy', body: 'See how paid subscription refund requests are handled.' },
  { title: 'Security Center', href: '/security', body: 'Review security practices for infrastructure, data, authentication, and billing.' },
  { title: 'Why Trust Corvioz', href: '/trust', body: 'Learn how Corvioz approaches transparency, data ownership, and product philosophy.' },
];

const futureResources = [
  'Documentation',
  'Changelog',
  'Status',
];

export default function HelpCenterPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <PublicHeader route="/help" surfaceId="help-public-header" logoSize={24} />

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '72px 24px 42px' }}>
        <p className="section-kicker">Help Center</p>
        <h1 className="section-title" style={{ marginBottom: '16px' }}>
          Trust, legal, and support resources in one place
        </h1>
        <p className="section-lede" style={{ maxWidth: '760px' }}>
          Use this page as the central entry for Corvioz support, policies, security, and transparency resources.
        </p>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {helpLinks.map((item) => (
            <Link key={item.href} href={item.href} className="card hover-card" style={{ padding: '24px', borderRadius: '8px', textDecoration: 'none' }}>
              <h2 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {item.title}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                {item.body}
              </p>
            </Link>
          ))}
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.2rem', fontWeight: 800 }}>
            Future resources
          </h2>
          <p style={{ margin: '0 0 14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            These resources are planned as Corvioz grows. They are listed here as the future home for support expansion.
          </p>
          <ul style={{ margin: 0, paddingLeft: '22px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
            {futureResources.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
