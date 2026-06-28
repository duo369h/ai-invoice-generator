import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import SharedFooter from './SharedFooter';
import ThemeToggle from './ThemeToggle';
import { Logo } from './UIComponents';

export default function TemplateSeoPage({ page }) {
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

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="navbar">
        <Logo />
        <div className="nav-links">
          <Link href="/invoice-generator" className="nav-link">Invoice Generator</Link>
          <Link href="/quote-generator" className="nav-link">Quote Generator</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      <header className="container" style={{ padding: '68px 24px 36px', maxWidth: '980px', margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.8rem)', lineHeight: 1.08, marginBottom: '18px', fontWeight: 850, letterSpacing: '-0.03em' }}>
          {page.h1}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.75, maxWidth: '760px', marginBottom: '26px' }}>
          {page.intro}
        </p>
        <Link href={page.ctaHref} className="btn btn-primary">{page.ctaText}</Link>
      </header>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '26px 24px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.9fr) minmax(320px, 1.1fr)', gap: '22px' }} className="seo-hero-grid">
          <div className="card" style={{ padding: '24px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Who this is for</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
              This template is built for {page.audience}. It gives you a focused structure before you create the final client document in Corvioz.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Example fields</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
              {page.fields.map((field) => (
                <div key={field} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px', color: 'var(--text-main)', background: 'var(--btn-secondary-bg)' }}>
                  {field}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '18px 24px 52px' }}>
        <div className="card" style={{ padding: '24px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '12px' }}>Common scope details</h2>
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', padding: 0, margin: 0, listStyle: 'none' }}>
            {page.deliverables.map((item) => (
              <li key={item} style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px 52px' }}>
        <style>{`
          .resource-link-card:hover .arrow-icon {
            transform: translateX(4px);
          }
        `}</style>
        <h2 style={{ fontSize: '1.35rem', marginBottom: '16px', letterSpacing: '-0.3px', fontWeight: 800 }}>Related resources</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {page.internalLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="card resource-link-card" 
              style={{ 
                padding: '20px 24px', 
                borderRadius: '12px', 
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <span style={{ fontWeight: 650, color: 'var(--text-main)', fontSize: '0.9rem' }}>{link.title}</span>
              <span className="arrow-icon" style={{ color: 'var(--primary)', fontWeight: 800, transition: 'transform 0.25s ease' }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '56px 0' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '28px' }}>Frequently Asked Questions</h2>
          <FaqAccordion items={page.faq} />
        </div>
      </section>

      <section className="container" style={{ padding: '62px 24px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '760px', margin: '0 auto', padding: '34px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>{page.ctaText} in Corvioz</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Use this template structure, then create the final document with editable line items, client details, payment terms, and PDF-ready formatting.
          </p>
          <Link href={page.relatedGeneratorPath} className="btn btn-primary">{page.ctaText}</Link>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
