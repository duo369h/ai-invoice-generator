import Link from 'next/link';
import SharedFooter from './SharedFooter';
import SeoEntryCta from './SeoEntryCta';
import PublicHeader from './PublicHeader';
import { getSiteUrl } from '../lib/config';

function buildJsonLd(page) {
  const canonicalUrl = `${getSiteUrl()}${page.path}`;
  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': page.schemaType || 'WebPage',
    name: page.h1,
    url: canonicalUrl,
    description: page.description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Corvioz',
      url: getSiteUrl(),
    },
    primaryImageOfPage: `${getSiteUrl()}/og-image.png`,
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

  const offerSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Corvioz',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: getSiteUrl(),
    description: 'Create freelancer profiles, quotes, invoices, and client portals in one workflow.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return [webPageSchema, faqSchema, offerSchema];
}

export default function SeoEntryLandingPage({ page }) {
  const jsonLd = buildJsonLd(page);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <PublicHeader
        route={page.path}
        surfaceId={`seo-entry-header-${page.analyticsSlug}`}
        navLinks={[
          { label: 'Invoices', href: '/invoice-generator' },
          { label: 'Quotes', href: '/quote-generator' },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Resources', href: '/blog' },
        ]}
        primaryAction={{ label: 'Create Quote', href: '/dashboard?tool=quote', variant: 'primary' }}
      />

      <header className="container" style={{ padding: '72px 24px 44px', maxWidth: '1120px', margin: '0 auto' }}>
        <div className="seo-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.12fr) minmax(320px, 0.88fr)', gap: '34px', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2.15rem, 4.8vw, 4rem)', lineHeight: 1.05, marginBottom: '20px', fontWeight: 850, letterSpacing: '-0.03em' }}>
              {page.h1}
            </h1>
            <p style={{ fontSize: '1.12rem', lineHeight: 1.75, color: 'var(--text-muted)', maxWidth: '720px', marginBottom: '28px' }}>
              {page.intro}
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <SeoEntryCta
                href={page.primaryCta.href}
                size="lg"
                eventProps={{ page_slug: page.analyticsSlug, position: 'hero_primary' }}
              >
                {page.primaryCta.label}
              </SeoEntryCta>
              <SeoEntryCta
                href={page.secondaryCta.href}
                variant="secondary"
                size="lg"
                eventProps={{ page_slug: page.analyticsSlug, position: 'hero_secondary' }}
              >
                {page.secondaryCta.label}
              </SeoEntryCta>
            </div>
          </div>

          <div className="card" style={{ padding: '26px', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '14px' }}>{page.previewTitle}</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {page.previewItems.map((item) => (
                <li key={item} style={{ display: 'flex', gap: '10px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '58px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '18px' }}>{page.whyTitle}</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: '22px' }}>
            {page.whyBody}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            {page.featureCards.map((feature) => (
              <div key={feature.title} className="card" style={{ padding: '18px', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{feature.title}</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '58px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>{page.workflowTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
            {page.workflowSteps.map((step, index) => (
              <div key={step.title} className="card" style={{ padding: '18px', borderRadius: '8px' }}>
                <p style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', marginBottom: '8px' }}>
                  Step {index + 1}
                </p>
                <h2 style={{ fontSize: '1.08rem', marginBottom: '8px' }}>{step.title}</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '58px 0' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '26px' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            {page.faq.map((item) => (
              <div key={item.question} className="card" style={{ padding: '20px', borderRadius: '8px' }}>
                <h2 style={{ fontSize: '1.08rem', marginBottom: '8px' }}>{item.question}</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '62px 24px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '760px', margin: '0 auto', padding: '34px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>{page.finalCtaTitle}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{page.finalCtaBody}</p>
          <SeoEntryCta
            href={page.primaryCta.href}
            size="lg"
            eventProps={{ page_slug: page.analyticsSlug, position: 'final_cta' }}
          >
            {page.primaryCta.label}
          </SeoEntryCta>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
