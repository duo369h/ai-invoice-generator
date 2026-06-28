'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from './UIComponents';
import { resolveAppState, resolveCopy } from 'lib/execution/globalOrchestrator';

export default function SharedFooter({ lang = 'en' }) {
  const isZh = lang === 'zh';
  const [appState, setAppState] = React.useState({
    identity: null,
    business_stage: 'freelancer',
    workspace_mode: 'standard',
    conversion_context: 'pricing'
  });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setAppState(resolveAppState());

    const handleUpdate = () => {
      setAppState(resolveAppState());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('corvioz_debug_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('corvioz_debug_update', handleUpdate);
    };
  }, []);

  const identity = appState.identity;

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
                ? 'Corvioz Freelancer OS 帮助自由职业者获客、报价、开票并更快收款。'
                : 'Corvioz Freelancer OS helps freelancers win clients, create quotes, send invoices, and get paid faster.'}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '产品' : 'Product'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/#features">{isZh ? '功能' : 'Features'}</Link></li>
              <li><Link href="/invoice-generator">{isZh ? '发票生成器' : 'Invoice Generator'}</Link></li>
              <li><Link href="/quote-generator">{isZh ? '报价生成器' : 'Quote Generator'}</Link></li>
              <li><Link href="/#how-it-works">{isZh ? '工作流' : 'How it works'}</Link></li>
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
              <li><Link href="/blog/invoice-vs-quote-vs-receipt">{isZh ? '如何给客户开具发票' : 'How to Invoice Clients'}</Link></li>
              <li><Link href="/invoice-template/photographer">{isZh ? '摄影师发票模板' : 'Photographer Invoice Template'}</Link></li>
              <li><Link href="/quote-template/consultant">{isZh ? '顾问报价模板' : 'Consultant Quote Template'}</Link></li>
              <li><Link href="/blog/how-to-price-web-design-projects">{isZh ? '自由职业定价策略' : 'Freelance Pricing Guide'}</Link></li>
              <li><Link href="/blog/best-invoice-software-for-freelancers">{isZh ? '自由职业收款加速技巧' : 'Get Paid Faster Guide'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '16px', fontWeight: 700 }}>
              {isZh ? '公司' : 'Company'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><Link href="/contact">{isZh ? '联系我们' : 'Contact'}</Link></li>
              <li><Link href="/client">{isZh ? '客户门户' : 'Client Portal'}</Link></li>
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
            {isZh ? (
              identity === 'starter' 
                ? '无设置风险。安全开启自由职业生涯' 
                : identity === 'growth' 
                ? '备受成长的自由职业专业人士信赖' 
                : identity === 'studio' 
                ? '专为多客户规模化运营打造' 
                : '选择您的运营身份以定制您的自由职业工作流。'
            ) : (
              mounted ? resolveCopy(appState, 'pricing').cardTrustMicrocopy : 'Select your operating identity to customize your freelance workflow.'
            )}
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
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🔒 {
              isZh ? (
                identity === 'starter' 
                  ? '安全的首个发票发送方式' 
                  : identity === 'growth' 
                  ? '安全客户流水线管理' 
                  : identity === 'studio' 
                  ? '企业级机构基础设施' 
                  : '自由职业操作系统'
              ) : (
                mounted ? resolveCopy(appState, 'pricing').trustBadges[0] : 'Freelancer Operating System'
              )
            }</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🇪🇺 {isZh ? 'GDPR就绪' : 'GDPR Ready'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💳 {isZh ? '安全支付' : 'Secure Payments'}</span>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>© 2026 Corvioz. {isZh ? '保留所有权利。' : 'All rights reserved.'} <span style={{ marginLeft: '12px', color: 'var(--text-muted)', borderLeft: '1px solid var(--border)', paddingLeft: '12px' }}>{isZh ? '专为自由职业者打造的 Beta 版本' : 'Built for Freelancers in Beta'}</span></p>
        </div>
      </div>
    </footer>
  );
}
