'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [lang, setLang] = useState('en');

  const t = {
    en: {
      title: 'Free AI Invoice Generator for Freelancers',
      subtitle: 'Turn plain text into clean invoices and receipts. Create client-ready PDFs in minutes, no signup required for the basic tool.',
      ctaPrimary: 'Get Started Free',
      ctaSecondary: 'View Features',
      featuresTitle: 'Key Features',
      feature1Title: 'Generate from Text',
      feature1Desc: 'Type or paste billing notes, client details, and service descriptions. InvoiceAI turns them into structured, itemized invoices.',
      feature2Title: 'Receipt Generator',
      feature2Desc: 'Quickly create digital receipts for point-of-sale transactions or proof-of-purchase records with a single click.',
      feature3Title: 'PDF Download',
      feature3Desc: 'Download clean, professional PDFs formatted for A4 invoices and receipts.',
      feature4Title: 'Multi-Currency Support',
      feature4Desc: 'Create and export invoices in USD, EUR, GBP, CNY, or JPY instantly with automatic symbol conversion.',
      pricingTitle: 'Simple, Transparent Pricing',
      planFreeName: 'Free Starter',
      planFreePrice: '$0',
      planFreePeriod: 'forever',
      planFreeFeatures: ['Up to 5 invoices/month', '3 AI parses/month', 'Basic PDF templates', 'Manual data entry'],
      planProName: 'Professional — Coming Soon',
      planProPrice: '$9',
      planProPeriod: 'per month',
      planProFeatures: ['Planned unlimited invoices & receipts', 'Planned 100 AI Auto-fills per month', 'Custom branding & logo uploads', 'High-quality PDF downloads'],
      choosePlan: 'Get Started',
      joinWaitlist: 'Join Waitlist',
      footer: '© 2026 InvoiceAI. All rights reserved.'
    },
    zh: {
      title: '面向自由职业者的免费 AI 发票生成器',
      subtitle: '把普通文字变成整洁的发票和收据，快速导出可给客户使用的 PDF。基础工具无需注册即可使用。',
      ctaPrimary: '免费开始使用',
      ctaSecondary: '查看功能',
      featuresTitle: '核心功能',
      feature1Title: '文本一键生成',
      feature1Desc: '输入或粘贴账单说明、客户信息和服务内容，InvoiceAI 会整理成结构化明细发票。',
      feature2Title: '快速收据制作',
      feature2Desc: '快速生成电子收据，适用于销售点交易、个人记账或各种消费凭证的快捷记录。',
      feature3Title: 'PDF 下载',
      feature3Desc: '快速下载整洁、专业的 A4 发票和收据 PDF。',
      feature4Title: '多货币支持',
      feature4Desc: '支持以美元 (USD)、欧元 (EUR)、英镑 (GBP)、人民币 (CNY) 或日元 (JPY) 进行开票，并自动进行符号转换。',
      pricingTitle: '简单透明的资费计划',
      planFreeName: '免费体验版',
      planFreePrice: '¥0',
      planFreePeriod: '永久免费',
      planFreeFeatures: ['每月免费生成 5 张发票', '每月 3 次 AI 自动生成', '标准版 PDF 导出', '手动填写发票信息'],
      planProName: '专业版 — 即将推出',
      planProPrice: '¥65',
      planProPeriod: '按月付费',
      planProFeatures: ['计划支持无限量发票与收据', '计划支持每月 100 次 AI 智能填充', '自定义品牌 Logo 与样式', '高清 PDF 无水印导出'],
      choosePlan: '开始使用',
      joinWaitlist: '加入等待名单',
      footer: '© 2026 InvoiceAI. 保留所有权利。'
    }
  };

  const current = t[lang];

  return (
    <div>
      {/* Navigation */}
      <nav className="navbar">
        <div className="logo-container">
          <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <span>{lang === 'en' ? 'InvoiceAI' : '发票智能助手'}</span>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">{current.featuresTitle}</a>
          <a href="#pricing" className="nav-link">{lang === 'en' ? 'Pricing' : '资费价格'}</a>
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
            className="btn btn-secondary btn-sm"
            style={{ marginRight: '8px', cursor: 'pointer' }}
          >
            {lang === 'en' ? '中文' : 'English'}
          </button>
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            {lang === 'en' ? 'Dashboard' : '控制台'}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span className="badge" style={{ marginBottom: '20px' }}>
            {lang === 'en' ? 'Free invoice tool' : '免费发票工具'}
          </span>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {current.title}
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            {current.subtitle}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
              {current.ctaPrimary}
            </Link>
            <a href="#features" className="btn btn-secondary" style={{ padding: '0.875rem 2rem' }}>
              {current.ctaSecondary}
            </a>
          </div>
        </div>

        {/* Hero Interactive UI Mockup */}
        <div style={{ marginTop: '60px', border: '1px solid var(--border)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ background: '#181b28', borderRadius: '8px', height: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></span>
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#818cf8', maxWidth: '500px', margin: '0 auto 10px auto' }}>
              &gt; AI.parse(&quot;Bill ACME Corp $1,200 for Web Design Services&quot;);
            </p>
            <div style={{ background: '#090a0f', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)', width: '80%', maxWidth: '400px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>INVOICE #INV-4927</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>PAID</span>
              </div>
              <div style={{ fontSize: '0.85rem', marginBottom: '5px' }}><strong>Billed To:</strong> ACME Corp</div>
              <div style={{ fontSize: '0.85rem', marginBottom: '15px' }}><strong>Date:</strong> 2026-06-10</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #1e293b', paddingBottom: '5px' }}>
                <span>Web Design Services</span>
                <span>$1,200.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold', paddingTop: '10px' }}>
                <span>Total:</span>
                <span style={{ color: '#818cf8' }}>$1,200.00 USD</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '48px', fontWeight: 700 }}>{current.featuresTitle}</h2>
          <div className="grid-container-2col">
            <div className="card">
              <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--primary)', marginBottom: '16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{current.feature1Title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{current.feature1Desc}</p>
            </div>
            <div className="card">
              <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--primary)', marginBottom: '16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{current.feature2Title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{current.feature2Desc}</p>
            </div>
            <div className="card">
              <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--primary)', marginBottom: '16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{current.feature3Title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{current.feature3Desc}</p>
            </div>
            <div className="card">
              <div style={{ width: '40px', height: '40px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--primary)', marginBottom: '16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{current.feature4Title}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{current.feature4Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '12px', fontWeight: 700 }}>{current.pricingTitle}</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '48px' }}>
            {lang === 'en' ? 'Start creating invoices instantly. Upgrade for advanced features.' : '即可开始创建发票。升级以解锁高级功能。'}
          </p>
          <div className="grid-container-2col">
            {/* Free Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{current.planFreeName}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{current.planFreePrice}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ {current.planFreePeriod}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {current.planFreeFeatures.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--success)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard" className="btn btn-secondary" style={{ textAlign: 'center' }}>
                {current.choosePlan}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderColor: 'var(--primary)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}>
              <div>
                <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                  <span className="badge" style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>{lang === 'en' ? 'COMING SOON' : '即将推出'}</span>
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>{current.planProName}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{current.planProPrice}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ {current.planProPeriod}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {current.planProFeatures.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--success)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard?upgrade=true" className="btn btn-primary" style={{ textAlign: 'center' }}>
                {current.joinWaitlist}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <Link href="/privacy">{lang === 'en' ? 'Privacy Policy' : '隐私政策'}</Link>
            <Link href="/terms">{lang === 'en' ? 'Terms of Service' : '服务条款'}</Link>
            <Link href="/contact">{lang === 'en' ? 'Contact' : '联系我们'}</Link>
          </div>
          <p>{current.footer}</p>
        </div>
      </footer>
    </div>
  );
}
