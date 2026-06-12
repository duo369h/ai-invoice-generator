'use client';

import React from 'react';
import Link from 'next/link';

export default function SharedFooter({ lang = 'en' }) {
  const isZh = lang === 'zh';

  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '50px 0 40px 0', backgroundColor: 'var(--background-card)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Footer Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '40px', textAlign: 'left' }}>
          
          {/* Logo & Slogan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="logo-container" style={{ fontSize: '1.2rem' }}>
              <svg style={{width:'20px', height:'20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="13" y2="17" />
              </svg>
              <span>InvoiceAI</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              {isZh 
                ? '基于 AI 技术的智能发票与收据生成平台，专为自由职业者与中小企业打造。'
                : 'AI-powered invoice and receipt generation SaaS for freelancers, contractors, and agency owners.'}
            </p>
          </div>

          {/* Core Tools */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '生成工具' : 'Generators'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/ai-invoice-generator">{isZh ? 'AI 智能发票生成器' : 'AI Invoice Generator'}</Link></li>
              <li><Link href="/free-invoice-generator">{isZh ? '免费发票生成器' : 'Free Invoice Generator'}</Link></li>
              <li><Link href="/freelance-invoice-generator">{isZh ? '自由职业发票生成器' : 'Freelance Invoice Generator'}</Link></li>
              <li><Link href="/receipt-generator">{isZh ? '在线收据生成器' : 'Receipt Generator'}</Link></li>
              <li><Link href="/invoice-template-pdf">{isZh ? 'PDF 发票模板下载' : 'Invoice Template PDF'}</Link></li>
            </ul>
          </div>

          {/* Legal / Company */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '法律条款' : 'Legal & Support'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/privacy">{isZh ? '隐私政策' : 'Privacy Policy'}</Link></li>
              <li><Link href="/terms">{isZh ? '服务条款' : 'Terms of Service'}</Link></li>
              <li><Link href="/contact">{isZh ? '联系我们' : 'Contact Support'}</Link></li>
              <li><Link href="/dashboard">{isZh ? '控制台' : 'User Dashboard'}</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>© 2026 InvoiceAI. {isZh ? '保留所有权利。' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
