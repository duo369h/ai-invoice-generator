'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';
import { Button, Card, Section, Logo } from './components/UIComponents';
import { sendEvent as trackEvent } from './lib/analytics';
import { trackHeroCtaClick, trackLandingViewed, trackPricingClick } from './lib/product-analytics';
import { saveIntendedRoute, saveSelectedPlan } from './lib/intent-store';

const resources = [
  { title: 'Freelance Pricing Guide', href: '/blog/how-to-price-web-design-projects' },
  { title: 'How to Get Paid Faster', href: '/blog/best-invoice-software-for-freelancers' },
  { title: 'Invoice vs Quote vs Receipt', href: '/blog/invoice-vs-quote-vs-receipt' },
];

const faqs = [
  {
    q: 'Is Corvioz only for quotes?',
    a: 'No. While quotes are the starting point of the workflow, you can convert any approved quote into a professional invoice in one click and track the entire payment lifecycle.',
  },
  {
    q: 'Who is Corvioz built for?',
    a: 'Corvioz is designed specifically for solo freelancers, consultants, designers, developers, and marketers who want a clean, professional client billing workflow without bloated software.',
  },
  {
    q: 'Can I export PDF documents?',
    a: 'Yes. You can generate professional, clean PDF copies of your quotes and invoices to send directly to clients, or share white-labeled online portal links.',
  },
];

const launchWorkflowSteps = [
  { title: 'Create Quote', icon: '01' },
  { title: 'Generate Proposal', icon: '02' },
  { title: 'Send Invoice', icon: '03' },
  { title: 'Get Paid', icon: '04' },
];

function ProductPreview() {
  const steps = [
    { icon: '📝', label: 'Quote', text: '$3,200 Milestone Estimate', badge: 'Drafted' },
    { icon: '🤝', label: 'Accepted', text: 'Client approved quote', badge: 'Ready' },
    { icon: '✉️', label: 'Invoice', text: 'Payment link delivered', badge: 'Sent' },
    { icon: '💰', label: 'Paid', text: 'Direct transfer processed', badge: 'Completed' },
    { icon: '📈', label: '+$3,200', text: 'Wallet balance updated', badge: 'Received', isOutcome: true }
  ];

  return (
    <div className="hero-product-card" aria-label="Corvioz product preview" style={{ maxWidth: '1200px', width: '100%', border: '1px solid var(--border)' }}>
      <div className="product-topbar">
        <div className="window-dots"><span /><span /><span /></div>
        <span>corvioz.com/workspace/quotes</span>
        <span>Interactive Workflow Preview</span>
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <div className="workflow-container">
          {steps.map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className={`workflow-step ${step.isOutcome ? 'outcome-step' : ''}`}>
                <span className="workflow-step-icon">{step.icon}</span>
                <h4>{step.label}</h4>
                <p>{step.text}</p>
                <span className="workflow-step-badge" style={step.isOutcome ? { color: 'var(--success)', background: 'rgba(34, 197, 94, 0.15)' } : {}}>
                  {step.badge}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="workflow-arrow">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    trackLandingViewed({ source: 'homepage' });
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.plans) {
            setPlans(data.plans);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans on homepage:', err);
      } finally {
        if (active) setPlansLoading(false);
      }
    };
    fetchPlans();
    return () => {
      active = false;
    };
  }, []);

  const getToggleBtnStyle = (isActive) => ({
    background: isActive ? 'var(--primary)' : 'transparent',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '99px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: isActive ? '#ffffff' : 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
  });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      <nav className="navbar landing-nav">
        <Logo />
        <div className="nav-links desktop-only" style={{ gap: '24px' }}>
          <a href="#why-corvioz" className="nav-link">Why Corvioz</a>
          <a href="#how-corvioz-works" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>

          <Button href="/dashboard" variant="secondary" size="sm" onClick={() => trackEvent('cta_click', { cta_name: 'Sign in', position: 'navbar' })}>Sign in</Button>
          <Button
            href="/dashboard?tool=quote"
            variant="primary"
            size="sm"
            onClick={() => {
              saveIntendedRoute('/dashboard?tool=quote', '/');
              trackEvent('signup_click', { position: 'navbar' });
              trackEvent('cta_click', { cta_name: 'Create a Quote', position: 'navbar' });
            }}
            style={{
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              fontWeight: 700
            }}
          >
            Create a Quote
          </Button>
          <ThemeToggle />
        </div>
        <div className="mobile-nav-actions">
          <ThemeToggle />
          <button
            type="button"
            className={`hamburger-btn ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer animate-fade-in">
            <a href="#why-corvioz" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Why Corvioz</a>
            <a href="#how-corvioz-works" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="mobile-menu-divider" />
            <Button href="/dashboard" variant="secondary" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); trackEvent('cta_click', { cta_name: 'Sign in', position: 'mobile_menu' }); }}>Sign in</Button>
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              style={{ width: '100%', marginTop: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
              onClick={() => {
                setMobileMenuOpen(false);
                saveIntendedRoute('/dashboard?tool=quote', '/');
                trackEvent('signup_click', { position: 'mobile_menu' });
                trackEvent('cta_click', { cta_name: 'Create a Quote', position: 'mobile_menu' });
              }}
            >
              Create a Quote
            </Button>
          </div>
        )}
      </nav>

      <header className="landing-hero animate-fade-in" style={{ minHeight: '40vh', paddingBottom: '32px', paddingTop: '80px' }}>
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-glow)',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '4px 14px',
            fontSize: '0.75rem',
            color: 'var(--primary)',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            Early Access for Freelancers
          </div>
          <h1 style={{ fontSize: 'clamp(2.3rem, 6vw, 4.2rem)', lineHeight: 1.15, marginBottom: '20px', color: 'var(--text-main)', letterSpacing: '-0.03em', fontWeight: 800 }}>
            Get a price.<br />
            <span className="glow-gradient-text" style={{ fontWeight: 900 }}>Win better clients.</span>
          </h1>
          <p style={{ fontSize: '1.18rem', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '680px', margin: '0 auto 32px auto', lineHeight: 1.6 }}>
            Corvioz helps freelancers create quotes, send invoices, and get paid faster.
          </p>

          <div className="hero-actions" style={{ justifyContent: 'center', marginBottom: '24px', gap: '16px' }}>
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                trackHeroCtaClick({ cta_name: 'Create a Quote', position: 'hero' });
                trackEvent('cta_click', { cta_name: 'Create a Quote', position: 'hero' });
              }}
              style={{ padding: '16px 36px', fontSize: '1rem', fontWeight: 900, borderRadius: '99px', transition: 'all 0.3s ease', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35)' }}
            >
              Create a Quote
            </Button>
            <Button
              href="/demo"
              variant="secondary"
              size="lg"
              onClick={() => { trackHeroCtaClick({ cta_name: 'Explore Example', position: 'hero' }); trackEvent('cta_click', { cta_name: 'Explore Example', position: 'hero' }); }}
              style={{ padding: '16px 30px', fontSize: '1rem', fontWeight: 800, borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', transition: 'all 0.3s ease' }}
            >
              Explore Example
            </Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600 }}>
            <span>✓ No credit card required</span>
            <span>✓ Free during Early Access</span>
            <span>✓ Built with real freelancer feedback</span>
          </div>
        </div>
      </header>

      <section style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 48px 20px' }}>
        <ProductPreview />
      </section>

      <Section id="how-corvioz-works" style={{ backgroundColor: 'var(--bg-main)', paddingTop: '36px', paddingBottom: '28px' }} containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
        <p className="section-kicker">How Corvioz Works</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '22px' }}>
          {launchWorkflowSteps.map((step) => (
            <div key={step.title} style={{ padding: '16px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 800, marginBottom: '10px' }}>
                {step.icon}
              </span>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{step.title}</h3>
            </div>
          ))}
        </div>
      </Section>

      <Section id="why-corvioz" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p className="section-kicker">Why Corvioz</p>
          <h2 className="section-title">Built for Independent Freelancers</h2>
          <p className="section-lede">The simple, professional workspace to handle billing, client management, and portfolios without subscription creep.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', textAlign: 'left', marginBottom: '40px' }}>
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>Work more professionally</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Send quotes, invoices, and client updates from one workspace.
            </p>
          </div>
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>Charge with confidence</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Track project outcomes and build confidence in future pricing decisions.
            </p>
          </div>
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px', color: 'var(--text-main)' }}>Stay in control</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Your projects, your clients, your data. No lock-in.
            </p>
          </div>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-soft)', border: '1px solid var(--border)', borderRadius: '99px', padding: '10px 24px', background: 'var(--btn-secondary-bg)', fontWeight: 600 }}>
          <span>🔒 100% Secure Payments</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>🛡️ GDPR & CCPA Compliant</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>✨ No Credit Card Required to Try</span>
        </div>
      </Section>

      <Section id="trust" containerStyle={{ maxWidth: '1120px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p className="section-kicker">Platform Integrity & Previews</p>
          <h2 className="section-title">Verified Visual Previews</h2>
          <p className="section-lede">Explore the visual structure and interface layouts of the Corvioz workspace. No fake testimonials, no mock logos—just real product outlines.</p>
        </div>

        <div className="trust-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <Card style={{ padding: '28px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Freelancer Focus</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--text-main)' }}>Built for real freelancers</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
              A focused, lightweight workspace built specifically for independent professionals, sole proprietors, and consultants.
            </p>
          </Card>
          <Card style={{ padding: '28px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Global Trust</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--text-main)' }}>Used worldwide</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
              Freelancers use Corvioz to draft milestone quotes, send professional invoices, and collect client payments worldwide.
            </p>
          </Card>
          <Card style={{ padding: '28px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Active Development</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--text-main)' }}>Early Access</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
              We grow with real feedback. We prioritize simple, direct freelance billing workflows over complex systems and algorithms.
            </p>
          </Card>
        </div>

        <div className="screenshot-gallery-grid">
          <div className="product-preview-card">
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 850, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Layout 01</span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Freelancer Dashboard</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                A focused workspace for pipeline status, active clients, open invoices, and revenue outcomes.
              </p>
            </div>
            <div className="screenshot-window-mockup">
              <div className="screenshot-window-dots"><span /><span /><span /></div>
              <div className="wireframe-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                    <span style={{ background: 'rgba(255,255,255,0.03)', height: '14px', width: '30%', borderRadius: '4px' }}></span>
                    <span style={{ background: 'rgba(255,255,255,0.03)', height: '14px', width: '20%', borderRadius: '4px' }}></span>
                  </div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.2)', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--primary)' }}>
                    Dashboard overview
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '4px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', height: '36px', borderRadius: '4px' }}></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', height: '36px', borderRadius: '4px' }}></div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', height: '36px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="product-preview-card">
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 850, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Layout 02</span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Milestone Proposals</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Turn project scope, milestone pricing, and client approval into a clean proposal flow.
              </p>
            </div>
            <div className="screenshot-window-mockup">
              <div className="screenshot-window-dots"><span /><span /><span /></div>
              <div className="wireframe-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.03)', height: '14px', width: '60%', borderRadius: '4px' }}></span>
                  </div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.2)', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--primary)' }}>
                    Proposal builder
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', height: '40px', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 10px', justifyContent: 'space-between' }}>
                    <span style={{ background: 'rgba(255,255,255,0.04)', height: '8px', width: '40%', borderRadius: '2px' }}></span>
                    <span style={{ background: 'var(--primary)', height: '18px', width: '25%', borderRadius: '4px' }}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="product-preview-card">
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 850, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Layout 03</span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Invoice & Payments</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Create branded invoices, track payment status, and keep client billing records in one place.
              </p>
            </div>
            <div className="screenshot-window-mockup">
              <div className="screenshot-window-dots"><span /><span /><span /></div>
              <div className="wireframe-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                    <span style={{ background: 'rgba(255,255,255,0.03)', height: '14px', width: '40%', borderRadius: '4px' }}></span>
                    <span style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', fontSize: '0.55rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>PAID</span>
                  </div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.2)', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--primary)' }}>
                    Invoice timeline
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '2px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.04)', height: '8px', width: '20%', borderRadius: '2px' }}></span>
                    <span style={{ background: 'rgba(255,255,255,0.06)', height: '12px', width: '30%', borderRadius: '2px' }}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="product-preview-card">
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 850, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Layout 04</span>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>Client Portal</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                Give clients a direct place to review proposals, invoices, approvals, and payment updates.
              </p>
            </div>
            <div className="screenshot-window-mockup">
              <div className="screenshot-window-dots"><span /><span /><span /></div>
              <div className="wireframe-box">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.04)', height: '16px', width: '16px', borderRadius: '50%' }}></span>
                    <span style={{ background: 'rgba(255,255,255,0.03)', height: '10px', width: '50%', borderRadius: '2px' }}></span>
                  </div>
                  <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px dashed rgba(99, 102, 241, 0.2)', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--primary)' }}>
                    Client portal
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.02)', height: '14px', flex: 1, borderRadius: '2px' }}></span>
                    <span style={{ background: 'rgba(255,255,255,0.02)', height: '14px', flex: 1, borderRadius: '2px' }}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="pricing" containerStyle={{ maxWidth: '1120px', textAlign: 'center' }}>
        <p className="section-kicker">Pricing</p>
        <h2 className="section-title">Pick your plan.</h2>
        <p className="section-lede" style={{ marginBottom: '24px' }}>Start free. Upgrade only when Corvioz becomes part of your workflow.</p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📈 Switch to Yearly for 2 Months Free (Save 20%)
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--btn-secondary-bg)', padding: '4px', borderRadius: '99px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              style={getToggleBtnStyle(billingPeriod === 'monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('yearly')}
              style={{ ...getToggleBtnStyle(billingPeriod === 'yearly'), display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Yearly <span style={{ background: 'var(--success-glow)', color: 'var(--success)', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '99px', fontWeight: 750 }}>Save 20%</span>
            </button>
          </div>
        </div>

        {plansLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading plans...</p>
          </div>
        ) : (
          <div className="pricing-grid pricing-grid-three">
            {plans.filter(p => p.id !== 'free').map((plan) => {
              const isPro = plan.id === 'pro';
              const isGrowth = plan.id === 'growth';
              const isFeatured = isGrowth;

              const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
              const billedAnnuallyText = plan.price_yearly > 0 ? `billed annually as $${Math.round(plan.price_yearly * 12)}` : null;

              const displayName = isPro ? 'Starter' : isGrowth ? 'Pro' : 'Studio';
              const displayDescription = isPro
                ? 'Get your first client faster with professional estimates.'
                : isGrowth
                ? 'Start getting paid professionally with unlimited portals.'
                : 'Run multiple clients like a small agency.';

              const displayFeatures = isPro
                ? ['Create professional quotes', 'Generate PDF invoices', 'Track client payments']
                : isGrowth
                ? ['Unlimited quotes & proposals', 'No watermarks on PDF exports', 'Private client portals', 'Direct payment collection']
                : ['Everything in Pro plan', '2–3 active client workspaces', 'Premium templates pack', 'Faster batch PDF exports'];

              const ctaText = isPro ? 'Get Starter' : isGrowth ? 'Get Pro' : 'Get Studio';
              const hrefVal = `/pricing?checkout=${plan.id}`;

              return (
                <Card
                  key={plan.id}
                  className={`pricing-card ${isFeatured ? 'featured' : ''}`}
                  style={isFeatured ? {
                    border: '2.5px solid var(--primary)',
                    transform: 'scale(1.03) translateY(-8px)',
                    boxShadow: 'var(--shadow-glow), 0 20px 40px rgba(99, 102, 241, 0.15)',
                    zIndex: 2,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '36px'
                  } : {
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '36px'
                  }}
                >
                  {isFeatured && (
                    <div style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      color: '#ffffff',
                      backgroundColor: 'var(--primary)',
                      padding: '6px 16px',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                      whiteSpace: 'nowrap',
                      zIndex: 10
                    }}>
                      ⭐ Most freelancers choose this
                    </div>
                  )}
                  <div>
                    <h3>{displayName}</h3>
                    <div className="price-line" style={{ marginBottom: billingPeriod === 'yearly' ? '8px' : '24px' }}>
                      <strong>{`$${price}`}</strong>
                      <span>/month</span>
                    </div>
                    {billingPeriod === 'yearly' && billedAnnuallyText && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-12px', marginBottom: '20px', fontWeight: 600 }}>
                        {billedAnnuallyText}
                      </div>
                    )}
                    <p style={{ color: isFeatured ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {displayDescription}
                    </p>
                    <ul>
                      {displayFeatures.map((feature) => (
                        <li key={feature}><CheckIcon /> {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <Button
                      href={hrefVal}
                      variant={isFeatured ? 'primary' : 'secondary'}
                      style={{
                        width: '100%',
                        boxShadow: isFeatured ? '0 8px 24px rgba(99, 102, 241, 0.3)' : 'none',
                        fontWeight: isFeatured ? 800 : 600
                      }}
                      onClick={() => {
                        const planKey = plan.id;
                        saveSelectedPlan(planKey, '/');
                        trackPricingClick({ position: 'pricing_card', plan: planKey });
                        trackEvent('pricing_select_plan', { position: 'pricing_card', plan: planKey });
                        trackEvent('cta_click', { cta_name: ctaText, position: 'pricing_card', plan: planKey });
                      }}
                    >
                      {ctaText}
                    </Button>

                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      By continuing, you agree to our <Link href="/terms" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Terms</Link> & <Link href="/privacy" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Privacy Policy</Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Section id="resources" style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
        <p className="section-kicker">Resources</p>
        <h2 className="section-title">Practical Guides for Client Work</h2>
        <div className="feature-overview-grid" style={{ marginTop: '36px' }}>
          {resources.map((resource) => (
            <Link key={resource.href} href={resource.href} className="resource-card">
              {resource.title}
            </Link>
          ))}
        </div>
      </Section>

      <Section id="faq" containerStyle={{ maxWidth: '860px', textAlign: 'center' }}>
        <p className="section-kicker">FAQ</p>
        <h2 className="section-title">Common Questions</h2>
        <div className="faq-list">
          {faqs.map((item, idx) => (
            <div key={item.q} className="faq-item">
              <button type="button" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                <span>{item.q}</span>
                <span>{activeFaq === idx ? '-' : '+'}</span>
              </button>
              {activeFaq === idx && <p>{item.a}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="transparency" containerStyle={{ maxWidth: '980px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', textAlign: 'left' }}>
          <div className="card" style={{ padding: '32px', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Note from the Founder</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>Built for Independent Professionals</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
              &quot;Hi, I&apos;m Duo, the creator of Corvioz. Like many of you, I struggled with bloated, expensive CRM software and accounting tools that assumed I had a finance team.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
              We built Corvioz to give freelancers a focused, fast, and beautiful space to handle quotes and invoices. We believe in providing value first—which is why you can try the tool with zero signup and download watermarked copies for free.&quot;
            </p>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>— Duo, Founder of Corvioz</strong>
          </div>

          <div className="card" style={{ padding: '32px', background: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Ethical & Transparent</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>Our Transparency Pledge</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
              We respect your data and trust. Guest mode drafts are secured locally in your own browser cache using localStorage. We do not track or store your client information on our servers until you choose to sign up and sync it.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '0' }}>
              Our monetization is simple: Professional Invoice Delivery, custom client portals, and CRM management are Pro features. We never sell your data, and we do not use manipulative pricing or fake urgency timers.
            </p>
          </div>
        </div>
      </Section>

      <Section id="final-cta" style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '840px', textAlign: 'center' }}>
        <p className="section-kicker">
          Built for real freelancers
        </p>
        <h2 className="section-title">
          Ready to win more clients?
        </h2>
        <p className="section-lede">
          Create milestone quotes, convert to invoices, and secure payments instantly.
        </p>
        <div className="hero-actions center" style={{ marginBottom: '8px' }}>
          <Button
            href="/dashboard?tool=quote"
            variant="primary"
            size="lg"
            onClick={() => {
              saveIntendedRoute('/dashboard?tool=quote', '/');
              trackEvent('quote_create_click', { position: 'final_cta' });
              trackEvent('cta_click', {
                cta_name: 'Create a Quote',
                position: 'final_cta'
              });
            }}
          >
            Create a Quote
          </Button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
          Free during early access. No credit card required.
        </p>
      </Section>

      <footer className="landing-footer landing-footer-grid">
        <div>
          <Logo />
          <p>
            Get a price. Win better clients.
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>Built for Freelancers in Beta</p>
        </div>
        <div>
          <strong>Product</strong>
          <a href="#how-corvioz-works">How it works</a>
          <a href="#why-corvioz">Why Corvioz</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div>
          <strong>Resources</strong>
          <Link href="/blog">Blog</Link>
          <Link href="/blog/how-to-price-web-design-projects">Pricing guide</Link>
          <Link href="/blog/best-invoice-software-for-freelancers">Get paid</Link>
        </div>
        <div>
          <strong>Company</strong>
          <Link href="/contact">Contact</Link>
          <Link href="/dashboard?tool=client">Client portal</Link>
          <Link href="/dashboard">Sign in</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/security">Security & Data</Link>
        </div>

        <div style={{
          gridColumn: '1 / -1',
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          marginTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '100%'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 600, textAlign: 'center' }}>
            🔒 GDPR Ready • 🇪🇺 CCPA Compliant • 💳 Secure Payments
          </p>
        </div>
      </footer>
    </main>
  );
}
