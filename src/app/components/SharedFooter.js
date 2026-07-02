'use client';

import Link from 'next/link';
import { Logo } from './UIComponents';

export default function SharedFooter({ lang = 'en' }) {
  const isZh = lang === 'zh';

  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '50px 0 40px 0', backgroundColor: 'var(--background-card)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <style>{`
        footer a {
          color: var(--text-muted);
          text-decoration: none;
          transition: var(--transition);
        }
        footer a:hover {
          color: var(--text-main);
        }
      `}</style>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Footer Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', marginBottom: '40px', textAlign: 'left' }}>
          
          {/* Logo & Slogan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Logo size={22} style={{ fontSize: '1.2rem' }} textStyle={{ letterSpacing: '-0.03em' }} />
            <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              {isZh 
                ? 'Corvioz 帮助自由职业者组织报价、提案、客户文档和项目记录。'
                : 'Corvioz helps freelancers organize quotes, proposals, client documents, and project records in one focused workspace.'}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '产品' : 'Product'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/#why-corvioz">{isZh ? '为什么选择 Corvioz' : 'Why Corvioz'}</Link></li>
              <li><Link href="/invoice-generator">{isZh ? '发票模板' : 'Invoice Templates'}</Link></li>
              <li><Link href="/quote-generator">{isZh ? '报价' : 'Quotes'}</Link></li>
              <li><Link href="/proposal">{isZh ? '提案' : 'Proposals'}</Link></li>
              <li><Link href="/#how-corvioz-works">{isZh ? '客户工作流' : 'Client Workflow'}</Link></li>
              <li><Link href="/pricing">{isZh ? '价格' : 'Pricing'}</Link></li>
              <li><Link href="/dashboard">{isZh ? '登录' : 'Sign in'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '资源' : 'Resources'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/blog">{isZh ? '博客' : 'Blog'}</Link></li>
              <li><Link href="/blog/invoice-vs-quote-vs-receipt">{isZh ? '客户文档指南' : 'Client Document Guide'}</Link></li>
              <li><Link href="/invoice-template/photographer">{isZh ? '摄影师文档模板' : 'Photographer Document Template'}</Link></li>
              <li><Link href="/quote-template/consultant">{isZh ? '顾问报价模板' : 'Consultant Quote Template'}</Link></li>
              <li><Link href="/blog/how-to-price-web-design-projects">{isZh ? '自由职业定价策略' : 'Freelance Pricing Guide'}</Link></li>
              <li><Link href="/blog/best-invoice-software-for-freelancers">{isZh ? '客户跟进指南' : 'Client Follow-Up Guide'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '公司' : 'Company'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/contact">{isZh ? '联系我们' : 'Contact'}</Link></li>
              <li><Link href="/dashboard?tool=client">{isZh ? '客户门户' : 'Client Portal'}</Link></li>
              <li>
                <a href="mailto:support@corvioz.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  support@corvioz.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '法律' : 'Legal'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/privacy">{isZh ? '隐私政策' : 'Privacy Policy'}</Link></li>
              <li><Link href="/terms">{isZh ? '服务条款' : 'Terms of Service'}</Link></li>
              <li><Link href="/refund-policy">{isZh ? '退款政策' : 'Refund Policy'}</Link></li>
              <li><Link href="/security">{isZh ? '安全与数据' : 'Security & Data'}</Link></li>
              <li><Link href="/trust">{isZh ? '为什么信任 Corvioz' : 'Why Trust Corvioz'}</Link></li>
              <li><Link href="/help">{isZh ? '帮助中心' : 'Help Center'}</Link></li>
              <li><Link href="/contact">{isZh ? '联系支持' : 'Contact'}</Link></li>
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
                style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)', minWidth: '200px' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                {isZh ? '订阅' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Global Footer Trust & Badges */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '20px',
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 600 }}>
            {isZh ? '清晰的订阅条款、清晰的退款政策，以及用户自有的客户记录。' : 'Clear plan terms, clear refunds, and user-owned client records.'}
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 550,
            marginBottom: '10px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💳 {isZh ? '安全结账服务提供方：Paddle' : 'Secure checkout provider: Paddle'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🧾 {isZh ? '报价和客户记录归您所有' : 'Your quotes and client records remain yours'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🔒 {isZh ? '我们不会出售个人数据' : 'We never sell personal data'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🛡️ {isZh ? '采用行业标准安全实践保护' : 'Protected with industry-standard security practices'}</span>
          </div>
          <p style={{ margin: 0, maxWidth: '720px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {isZh
              ? '您的报价、提案、客户记录和导出文档归您所有。Corvioz 仅使用必要数据来运行工作区，并使用产品分析改进体验。我们不会出售个人数据。'
              : 'You own your quotes, proposals, client records, and exported documents. Corvioz uses necessary data to run the workspace and product analytics to improve the experience. We do not sell personal data.'}
          </p>
          <p style={{ margin: 0, maxWidth: '720px', fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {isZh
              ? '有问题？请联系 support@corvioz.com。我们通常会在一个工作日内回复。'
              : 'Questions? support@corvioz.com. Typical response: within one business day.'}
          </p>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>© 2026 Corvioz. {isZh ? '保留所有权利。' : 'All rights reserved.'} <span style={{ marginLeft: '12px', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>{isZh ? '为自由职业者打造' : 'Built for freelancers'}</span></p>
        </div>
      </div>
    </footer>
  );
}
