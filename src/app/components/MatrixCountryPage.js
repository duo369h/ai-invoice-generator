import Link from 'next/link';
import SharedFooter from './SharedFooter';
import ThemeToggle from './ThemeToggle';
import { Logo } from './UIComponents';

function buildBreadcrumbSchema(page, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: page.breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.item === '/' ? '' : crumb.item}`,
    })),
  };
}

export default function MatrixCountryPage({ page, siteUrl }) {
  const breadcrumbSchema = buildBreadcrumbSchema(page, siteUrl);

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <nav className="navbar">
        <Logo />
        <div className="nav-links">
          <Link href="/invoice-generator" className="nav-link">Invoice Generator</Link>
          <Link href="/quote-generator" className="nav-link">Quote Generator</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <ThemeToggle />
        </div>
      </nav>

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
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', lineHeight: 1.75, maxWidth: '800px', marginBottom: '18px' }}>
          {page.intro}
        </p>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '920px', marginBottom: '28px' }}>
          {page.body}
        </p>
      </header>

      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '54px 0' }}>
        <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '18px' }}>Choose a use-case page</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {page.useCaseLinks.map((link) => (
              <Link key={link.href} href={link.href} className="card hover-card" style={{ padding: '20px', borderRadius: '8px', textDecoration: 'none' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{link.label}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{link.description}</p>
              </Link>
            ))}
          </div>
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

      <SharedFooter />
    </main>
  );
}
