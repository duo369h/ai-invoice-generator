import React from 'react';
import Link from 'next/link';
import FaqAccordion from './FaqAccordion';
import SharedFooter from './SharedFooter';

export default function SeoPageLayout({
  title,
  subtitle,
  ctaText = 'Create Invoice Now',
  contentHtml,
  faqItems = [],
  lang = 'en'
}) {
  const isZh = lang === 'zh';
  
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div>
      {/* Inject JSON-LD FAQ Page Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* Navigation */}
      <nav className="navbar">
        <div className="logo-container">
          <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">InvoiceAI</Link>
        </div>
        <div className="nav-links">
          <Link href="/#features" className="nav-link">{isZh ? '功能介绍' : 'Features'}</Link>
          <Link href="/#pricing" className="nav-link">{isZh ? '价格方案' : 'Pricing'}</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            {isZh ? '控制台' : 'Dashboard'}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="container" style={{ padding: '60px 24px 40px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', lineHeight: '1.1', background: 'linear-gradient(135deg, #fff, var(--text-main))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {title}
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '30px' }}>
            {subtitle}
          </p>
          <Link href="/dashboard" className="btn btn-primary">
            {ctaText}
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="container" style={{ padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ lineHeight: '1.8', fontSize: '1.05rem', color: 'var(--text-main)' }} className="seo-content">
          {contentHtml}
        </div>
      </section>

      {/* FAQs */}
      {faqItems.length > 0 && (
        <section style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '60px 0' }}>
          <div className="container" style={{ padding: '0 24px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '30px', fontWeight: 700 }}>
              {isZh ? '常见问题解答' : 'Frequently Asked Questions'}
            </h2>
            <FaqAccordion items={faqItems} />
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="container" style={{ padding: '60px 24px', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
          <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', fontWeight: 800 }}>
            {isZh ? '准备好体验智能开票了吗？' : 'Ready to streamline your invoicing?'}
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.95rem' }}>
            {isZh 
              ? '使用发票智能助手，省去手动填写的繁琐。无需注册，直接使用！'
              : 'Try InvoiceAI for free today. Paste text, generate structured PDFs in seconds. No signup required.'}
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem' }}>
            {isZh ? '免费体验' : 'Get Started Now'}
          </Link>
        </div>
      </section>

      <SharedFooter lang={lang} />
    </div>
  );
}
