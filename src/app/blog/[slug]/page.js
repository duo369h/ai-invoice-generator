import Link from 'next/link';
import { notFound } from 'next/navigation';
import ThemeToggle from '../../components/ThemeToggle';
import { Logo } from '../../components/UIComponents';
import { getSiteUrl } from '../../lib/config';
import { blogSeoSlugs, getBlogPost } from '../../lib/blog-data';

export function generateStaticParams() {
  return blogSeoSlugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Corvioz Blog',
      description: 'The requested guide was not found.',
      robots: { index: false, follow: true },
    };
  }

  const canonical = `/blog/${slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: canonical,
      publishedTime: new Date(post.date).toISOString(),
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  };
}

function renderSection(section) {
  return (
    <section key={section.id}>
      <h2 id={section.id} style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
        {section.heading}
      </h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} style={{ marginBottom: '16px' }}>
          {paragraph}
        </p>
      ))}
      {section.bullets && (
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  const baseUrl = getSiteUrl();

  if (!post) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    alternativeHeadline: post.description,
    genre: post.category,
    keywords: post.keywords.join(', '),
    datePublished: new Date(post.date).toISOString().substring(0, 10),
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Corvioz',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo-symbol.svg`,
      },
    },
    description: post.description,
    mainEntityOfPage: `${baseUrl}/blog/${slug}`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((item) => ({
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
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${baseUrl}/blog/${slug}` },
    ],
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <nav className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/invoice-generator" className="nav-link">Invoice Generator</Link>
          <Link href="/quote-generator" className="nav-link">Quote Generator</Link>
          <Link href="/blog" className="nav-link" style={{ fontWeight: 700 }}>Blog</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '52px', alignItems: 'start' }} className="seo-hero-grid">
          <article className="card" style={{ padding: '48px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>
              <span>{post.category}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime}</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '16px', color: 'var(--text-main)' }}>
              {post.title}
            </h1>
            <p style={{ fontSize: '1.18rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '40px', borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
              {post.description}
            </p>

            <div style={{ color: 'var(--text-main)', lineHeight: 1.8, fontSize: '1.05rem', opacity: 0.92 }}>
              {post.sections.map(renderSection)}
            </div>

            <section style={{ marginTop: '46px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '16px' }}>FAQ</h2>
              <div style={{ display: 'grid', gap: '14px' }}>
                {post.faq.map((item) => (
                  <div key={item.question} style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '18px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.question}</h3>
                    <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '36px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '18px' }}>Recommended resources</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {post.internalLinks.map((link) => (
                  <Link key={link.url} href={link.url} className="card hover-card" style={{ display: 'block', padding: '18px', textDecoration: 'none' }}>
                    <strong style={{ display: 'block', color: 'var(--accent)', marginBottom: '6px' }}>{link.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.45 }}>{link.desc}</span>
                  </Link>
                ))}
              </div>
            </section>
          </article>

          <aside style={{ position: 'sticky', top: '96px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Table of contents</h2>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                {post.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} style={{ color: 'var(--text-muted)' }}>{section.heading}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card hover-glow" style={{ padding: '24px', border: '1px solid var(--primary)', borderRadius: '8px', background: 'var(--primary-glow)' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '8px' }}>Create client-ready documents</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '18px' }}>
                Use Corvioz to create quotes, send invoices, and publish a profile that clients can understand.
              </p>
              <Link href="/quote-generator" className="btn btn-secondary btn-sm" style={{ width: '100%', fontWeight: 700, marginBottom: '10px' }}>Create a Quote</Link>
              <Link href="/dashboard?action=create-profile" className="btn btn-primary btn-sm" style={{ width: '100%', fontWeight: 700 }}>Create Free Profile</Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
