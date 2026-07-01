import Link from 'next/link';
import SharedFooter from './SharedFooter';
import PublicHeader from './PublicHeader';

export function buildMatrixSeoSchemas(page, siteUrl) {
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

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.item === '/' ? '' : crumb.item}`,
    })),
  };

  return [softwareSchema, faqSchema, breadcrumbSchema];
}

export default function MatrixSeoPage({ page, siteUrl }) {
  const schemas = buildMatrixSeoSchemas(page, siteUrl);

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
        surfaceId="matrix-seo-public-header"
        navLinks={[
          { label: 'Invoices', href: '/invoice-generator' },
          { label: 'Quotes', href: '/quote-generator' },
          { label: 'Pricing', href: '/pricing' },
        ]}
        primaryAction={null}
      />

      <header className="container" style={{ padding: '72px 24px 42px', maxWidth: '1080px', margin: '0 auto' }}>
        <nav aria-label="Breadcrumb" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '18px' }}>
          {page.breadcrumbs.map((crumb, index) => (
            <span key={crumb.item}>
              {index > 0 && <span style={{ marginRight: '8px' }}>/</span>}
              <Link href={crumb.item} style={{ color: index === page.breadcrumbs.length - 1 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                {crumb.name}
              </Link>
            </span>
          ))}
        </nav>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.05, marginBottom: '18px', fontWeight: 850 }}>
          {page.h1}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.75, maxWidth: '780px', marginBottom: '20px' }}>
          {page.intro}
        </p>
        <div style={{ display: 'grid', gap: '16px', maxWidth: '920px', marginBottom: '28px' }}>
          {page.seoParagraphs.map((paragraph) => (
            <p key={paragraph} style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.8, margin: 0 }}>
              {paragraph}
            </p>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-primary">Start Free</Link>
          <Link href={page.basePath} className="btn btn-secondary">Open Main Tool</Link>
        </div>
      </header>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '54px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px', display: 'grid', gap: '30px' }}>
          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Real-world usage scenario</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.75 }}>{page.scenario}</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Who this is for</h2>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '22px' }}>
              {page.sections.who.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>How to use</h2>
            <ol style={{ color: 'var(--text-muted)', lineHeight: 1.75, paddingLeft: '22px' }}>
              {page.sections.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>{page.exampleTitle}</h2>
            <div className="card" style={{ padding: '24px', borderRadius: '8px', overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '22px' }}>
                <div>
                  <p style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                    {page.example.label}
                  </p>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{page.example.documentNumber}</h3>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Issued: {page.example.issueDate}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Due / valid: {page.example.dueDate}</p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}><strong>From:</strong> {page.example.from}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}><strong>To:</strong> {page.example.to}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}><strong>Currency:</strong> {page.example.currency}</p>
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}><strong>Payment:</strong> {page.example.paymentMethod}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Line item</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px' }}>Detail</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '12px 8px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {page.example.lineItems.map((item) => (
                    <tr key={item.description} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px' }}>{item.description}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{item.detail}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{page.example.symbol}{item.rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>{page.example.symbol}{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'grid', justifyContent: 'end', gap: '8px', marginTop: '18px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
                  <span>Subtotal</span>
                  <strong style={{ color: 'var(--text-main)' }}>{page.example.subtotalFormatted}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
                  <span>{page.example.taxLabel}</span>
                  <strong style={{ color: 'var(--text-main)' }}>{page.example.taxFormatted}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '48px', fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <strong style={{ color: 'var(--text-main)' }}>{page.example.totalFormatted}</strong>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, marginTop: '18px', marginBottom: 0 }}>
                {page.example.note}
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '56px 24px' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '18px' }}>Related Corvioz pages</h2>
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
