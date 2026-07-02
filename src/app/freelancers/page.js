import React from 'react';
import Link from 'next/link';
import { Button } from '../components/UIComponents';
import SharedFooter from '../components/SharedFooter';
import PublicHeader from '../components/PublicHeader';

export const metadata = {
  title: 'Corvioz Freelancer Directory | Find Premium Designers & Developers',
  description: 'Explore the Corvioz freelance directory. Find verified brand designers, Next.js developers, marketing specialists, fractional CMOs, and copywriters in the US & Canada.',
  alternates: { canonical: '/freelancers' },
  openGraph: {
    title: 'Corvioz Freelancer Directory | Find Premium Designers & Developers',
    description: 'Explore the Corvioz freelance directory. Find verified brand designers, Next.js developers, and marketing specialists.',
    url: '/freelancers',
    type: 'website',
  }
};

const directoryFaq = [
  {
    q: 'How does the Corvioz Freelancer Directory work?',
    a: 'Freelancers create a public Bento-grid profile detailing their availability, timezone, portfolio, and fixed-price services. Clients can search the directory, request quotes, and collaborate directly via secure client portals.'
  },
  {
    q: 'Can I request a custom quote from directory profiles?',
    a: 'Yes. Every public freelancer profile card has an integrated inquiry form. Clients submit project details which populate directly in the freelancer Leads Inbox.'
  },
  {
    q: 'Does Corvioz handle client payments?',
    a: 'No. Corvioz is a client workflow workspace for freelancer profiles, quote requests, proposals, and client records. Paid plan checkout is handled securely by Paddle.'
  }
];

export default function FreelancersDirectory({ defaultRole = 'All' }) {
  const isAll = defaultRole === 'All';
  const label = isAll ? 'Freelancer Directory' : `${defaultRole} Directory`;
  const roleSlug = defaultRole.toLowerCase().trim();

  // Custom metadata description for specific roles
  const descriptionText = isAll
    ? 'Connect with top freelance designers, developers, writers, marketers, and consultants. View availability, timezone parameters, service checklists, and request estimates.'
    : `Find and collaborate with premium freelance ${defaultRole}s. Review portfolio files, check timezone compatibility, and send quote requests directly to their inbox.`;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: directoryFaq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <PublicHeader
        route="/freelancers"
        surfaceId="freelancers-public-header"
        navLinks={[
          { label: 'Documents', href: '/invoice-generator' },
          { label: 'Quotes', href: '/quote-generator' },
          { label: 'Pricing', href: '/pricing' },
        ]}
        primaryAction={{ label: 'Create Profile', href: '/dashboard?action=create-profile', variant: 'primary' }}
      />

      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center', flex: 1 }}>
        <span className="badge" style={{ marginBottom: '20px' }}>Product Update</span>
        <h1 className="section-title" style={{ marginBottom: '16px', fontSize: '2.5rem', fontWeight: 850 }}>
          {label} is coming soon.
        </h1>
        <p className="section-lede" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7 }}>
          {descriptionText} Corvioz is currently optimizing secure private freelancer profiles, quote generation, client portals, and structured client delivery workflows. Public discovery categories will open next month.
        </p>
        <div className="hero-actions center" style={{ marginTop: '32px' }}>
          <Button href="/dashboard?action=create-profile" variant="primary" size="lg">Build Your Public Profile</Button>
          <Button href="/" variant="secondary" size="lg">Back to Home</Button>
        </div>
      </section>

      {/* Reusable Category Sub-navigation (Internal Linking Circle) */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '18px', fontWeight: 700 }}>Explore Freelancer Categories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {['Designers', 'Developers', 'Writers', 'Consultants', 'Marketers'].map((role) => {
              const slug = role.toLowerCase();
              const isActive = roleSlug === slug || (isAll && slug === 'designers');
              return (
                <Link
                  key={role}
                  href={`/freelancers/${slug}`}
                  className="card hover-card"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '24px',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: isActive ? 'rgba(79, 70, 229, 0.05)' : 'var(--card-bg)'
                  }}
                >
                  {role}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pre-rendered Directory FAQ */}
      <section className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '32px', fontWeight: 800 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'grid', gap: '20px' }}>
          {directoryFaq.map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 10px 0', fontWeight: 700 }}>{item.q}</h3>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', lineHeight: 1.65 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
