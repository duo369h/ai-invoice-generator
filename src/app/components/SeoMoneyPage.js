import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import SharedFooter from './SharedFooter';
import ThemeToggle from './ThemeToggle';
import { Logo } from './UIComponents';
import { getSiteUrl } from '../lib/config';

export default function SeoMoneyPage({ page }) {
  const canonicalUrl = `${getSiteUrl()}/${page.slug}`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: page.title,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: canonicalUrl,
    description: page.description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

      <nav className="navbar">
        <Logo />
        <div className="nav-links">
          <Link href="/invoice-generator" className="nav-link">Invoice Generator</Link>
          <Link href="/quote-generator" className="nav-link">Quote Generator</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="container" style={{ padding: '76px 24px 48px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: '36px', alignItems: 'center' }} className="seo-hero-grid">
          <div>
            <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 4.25rem)', lineHeight: 1.04, marginBottom: '20px', fontWeight: 850, letterSpacing: '-0.03em' }}>
              {page.h1}
            </h1>
            <p style={{ fontSize: '1.15rem', lineHeight: 1.75, color: 'var(--text-muted)', maxWidth: '720px', marginBottom: '28px' }}>
              {page.intro}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href={page.primaryHref} className="btn btn-primary">{page.primaryCta}</Link>
              <Link href={page.secondaryHref} className="btn btn-secondary">{page.secondaryCta}</Link>
            </div>
          </div>

          <div className="card" style={{ padding: '26px', borderRadius: '8px' }}>
            <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Core workflow
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: 0, margin: 0, listStyle: 'none' }}>
              {page.useCases.map((useCase) => (
                <li key={useCase} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-main)' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '58px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '18px' }}>
            Built for the V1 freelancer billing workflow
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '22px' }}>
            Corvioz focuses on the parts freelancers need first: quotes, invoices, public profiles, client portals, PDF export, and payment status. Proposal, contract, and tax content stays out of this V1 SEO build until the product surface is ready to support it.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Link href="/invoice-template/photographer" className="card hover-card" style={{ padding: '18px', textDecoration: 'none' }}>Invoice template examples</Link>
            <Link href="/quote-template/consultant" className="card hover-card" style={{ padding: '18px', textDecoration: 'none' }}>Quote template examples</Link>
            <Link href="/freelancers" className="card hover-card" style={{ padding: '18px', textDecoration: 'none' }}>Freelancer directory</Link>
            <Link href="/blog/how-to-price-web-design-projects" className="card hover-card" style={{ padding: '18px', textDecoration: 'none' }}>Pricing guide</Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '64px 0' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '28px' }}>Frequently Asked Questions</h2>
          <FaqAccordion items={page.faq} />
        </div>
      </section>

      <section className="container" style={{ padding: '18px 24px 70px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '760px', margin: '0 auto', padding: '34px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Ready to create a client-ready document?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start with the focused Corvioz V1 workflow and keep your quotes, invoices, profiles, and client records connected.</p>
          <Link href={page.primaryHref} className="btn btn-primary">{page.primaryCta}</Link>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
