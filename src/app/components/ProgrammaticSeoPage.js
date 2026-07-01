import Link from 'next/link';
import SharedFooter from './SharedFooter';
import PublicHeader from './PublicHeader';

export function buildProgrammaticSeoSchemas(page, siteUrl) {
  const canonicalUrl = `${siteUrl}${page.canonicalPath}`;

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

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    url: canonicalUrl,
    description: page.description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Corvioz',
      url: siteUrl,
    },
  };

  return [softwareSchema, faqSchema, webPageSchema];
}

export default function ProgrammaticSeoPage({ page, siteUrl }) {
  const schemas = buildProgrammaticSeoSchemas(page, siteUrl);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      {schemas.map((schema) => (
        <script
          key={schema['@type']}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <PublicHeader
        route={page.canonicalPath}
        surfaceId="programmatic-seo-public-header"
        navLinks={[
          { label: 'Invoices', href: '/invoice-generator' },
          { label: 'Quotes', href: '/quote-generator' },
          { label: 'Pricing', href: '/pricing' },
        ]}
      />

      <header className="container" style={{ padding: '76px 24px 44px', maxWidth: '1080px', margin: '0 auto' }}>
        <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px' }}>
          {page.category} SEO page
        </p>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.05, marginBottom: '18px', fontWeight: 850 }}>
          {page.h1}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.75, maxWidth: '760px', marginBottom: '28px' }}>
          {page.intro}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8, maxWidth: '860px', marginBottom: '28px' }}>
          {page.seoBody}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-primary">Start Free</Link>
          <Link href={page.basePath} className="btn btn-secondary">Open Main Tool</Link>
        </div>
      </header>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '54px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px', display: 'grid', gap: '28px' }}>
          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>What is this?</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75 }}>{page.sections.what}</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>How it Works</h2>
            <ol style={{ color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '22px' }}>
              {page.sections.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>
              Example {page.productType === 'invoice' ? 'invoice' : 'quote'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
              {page.sections.example.map((item) => (
                <div key={item} className="card" style={{ padding: '18px', borderRadius: '8px' }}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Who is it for</h2>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '22px' }}>
              {page.sections.who.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '56px 24px' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '18px' }}>Related Corvioz tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {page.internalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="card hover-card" style={{ padding: '18px', textDecoration: 'none', borderRadius: '8px' }}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '54px 0' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '22px' }}>FAQ</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            {page.faq.map((item) => (
              <section key={item.question} className="card" style={{ padding: '22px', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.question}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{item.answer}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
