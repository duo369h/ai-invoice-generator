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
              <span>Freelancer Business OS</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              {isZh 
                ? '自由职业者专属商业操作系统，集获客主页、AI报价生成、Stripe发票和线索管理于一体。'
                : 'Complete business operating system for freelancers to get clients, quote projects, collect payments, and manage invoices.'}
            </p>
          </div>

          {/* Core Tools */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '商业指南' : 'Business Guides'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/how-to-invoice-clients-as-freelancer">{isZh ? '如何给客户开具发票' : 'How to Invoice Clients'}</Link></li>
              <li><Link href="/freelance-contract-template-guide">{isZh ? '合同模板签署指南' : 'Contract Template Guide'}</Link></li>
              <li><Link href="/how-to-get-paid-faster-as-freelancer">{isZh ? '自由职业收款加速技巧' : 'Get Paid Faster Guide'}</Link></li>
              <li><Link href="/invoice-vs-quote-vs-receipt">{isZh ? '发票 vs 报价单 vs 收据' : 'Invoice vs Quote vs Receipt'}</Link></li>
              <li><Link href="/freelance-pricing-guide">{isZh ? '自由职业定价策略' : 'Freelance Pricing Guide'}</Link></li>
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
              <li><Link href="/refund-policy">{isZh ? '退款政策' : 'Refund Policy'}</Link></li>
              <li><Link href="/contact">{isZh ? '联系我们' : 'Contact Support'}</Link></li>
              <li><Link href="/dashboard">{isZh ? '控制台' : 'User Control Center'}</Link></li>
            </ul>
          </div>
        </div>

        {/* Email Newsletter Subscription (SEO Conversion assets) */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '24px 0', margin: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '480px' }}>
            <h5 style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
              {isZh ? '订阅自由职业业务增长通讯' : 'Get Freelance Growth Playbooks'}
            </h5>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isZh ? '订阅获取最新高转化提案模板、定价策略和产品功能更新邮件。' : 'Subscribe to get high-converting quote templates, pricing guides, and product updates.'}
            </p>
          </div>
          <div>
            <form onSubmit={(e) => { e.preventDefault(); alert(isZh ? '订阅成功！感谢您的加入。' : 'Subscription successful! Thank you.'); e.target.reset(); }} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="email" 
                placeholder={isZh ? '输入您的工作邮箱' : 'Enter your work email'} 
                required 
                style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', minWidth: '200px' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                {isZh ? '订阅' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>© 2026 Freelancer Business OS. {isZh ? '保留所有权利。' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
}
