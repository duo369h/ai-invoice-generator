'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';
import { Button, Card, Section, Logo } from './components/UIComponents';
import { sendEvent as trackEvent } from './lib/analytics';
import { trackHeroCtaClick, trackLandingViewed, trackPricingClick } from './lib/product-analytics';
import { saveIntendedRoute, saveSelectedPlan } from './lib/intent-store';
import Dashboard from '../components/dashboard/Dashboard';
import { CorviozKernel } from 'lib/kernel/corviozKernel';



const features = [
  {
    title: 'Milestone quotes',
    text: 'Turn project details into clear estimates clients can review, approve, and convert into invoices.',
  },
  {
    title: 'Professional invoices',
    text: 'Create manual or professional invoices, export PDFs, and track paid or outstanding balances.',
  },
  {
    title: 'Public freelancer profile',
    text: 'Publish an SEO-friendly profile with your about section, services, portfolio links, contact details, and quote request form.',
  },
  {
    title: 'Client portal',
    text: 'Give clients one clean place to view quotes, view invoices, download PDFs, and check payment status.',
  },
];

const testimonials = [
  {
    name: 'Early Access Member 01',
    role: 'Freelance Designer',
    location: 'Early Access Feedback',
    quote: 'The workspace feels focused around the moments that matter most: deciding what to charge, sending the proposal, and learning from the project afterward.',
    initials: 'EA'
  },
  {
    name: 'Early Access Member 02',
    role: 'Independent Developer',
    location: 'Early Access Feedback',
    quote: 'Corvioz makes the pricing conversation feel less scattered. I can keep the quote, proposal, invoice, and outcome in one clean path.',
    initials: 'EA'
  },
  {
    name: 'Early Access Member 03',
    role: 'Solo Consultant',
    location: 'Early Access Feedback',
    quote: 'It gives me a clearer record of what worked, what closed, and how I should think about the next project.',
    initials: 'EA'
  }
];

const launchWorkflowSteps = [
  { title: 'Quote', icon: '01' },
  { title: 'Pricing Recommendation', icon: '02' },
  { title: 'Proposal', icon: '03' },
  { title: 'Invoice', icon: '04' },
  { title: 'Project Outcome', icon: '05' },
];

const processStages = [
  {
    title: 'Lead',
    description: 'Prospects discover your services and submit quote requests on your public card profile.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: 'Quote',
    description: 'Create professional estimates from scope, milestones, and client requirements.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    title: 'Invoice',
    description: 'Convert accepted quotes into structured invoices with taxes, discount rates, and terms.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zm12 4H8v2h8V6zm0 4H8v2h8v-2zm-6 4H8v2h2v-2z" />
      </svg>
    )
  },
  {
    title: 'Client Portal',
    description: 'Share a secure workspace link where clients review estimates, pay invoices, and write comments.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
      </svg>
    )
  },
  {
    title: 'Payment',
    description: 'Clients pay instantly via credit card or transfer. Track balances and settle funds securely.',
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )
  }
];

const resources = [
  { title: 'Freelance Pricing Guide', href: '/blog/how-to-price-web-design-projects' },
  { title: 'How to Get Paid Faster', href: '/blog/best-invoice-software-for-freelancers' },
  { title: 'Invoice vs Quote vs Receipt', href: '/blog/invoice-vs-quote-vs-receipt' },
];

const faqs = [
  {
    q: 'Is Corvioz only for invoices?',
    a: 'No. Invoices are one part of Corvioz Freelancer OS. Our product focuses on connecting quotes, public profiles, client portals, PDF exports, and payment status tracking in one unified place.',
  },
  {
    q: 'Can I use Corvioz before payment processing is connected?',
    a: 'Yes. You can create your profile, generate quotes and invoices, export PDFs, and attach your own payment link (Stripe, PayPal, or Interac) directly.',
  },
  {
    q: 'Who is Corvioz built for?',
    a: 'Corvioz is built for solo freelancers, consultants, designers, developers, and marketers serving clients in the US and Canada who want to maintain a professional brand.',
  },
];

const identityFaqs = {
  starter: [
    {
      q: 'How does the Starter mode help me get my first client?',
      a: 'Starter mode is built to simplify the conversion loop. You can pitch milestone estimates, send simple professional invoices, and track your first payments with zero complexity.',
    },
    {
      q: 'Do I need a registered business to use Starter?',
      a: 'No. You can use your personal name, upload a profile photo, list your services, and start invoicing clients immediately as a sole proprietor.',
    },
    {
      q: 'Can I use Starter for free?',
      a: 'Yes. You can generate local draft invoices, export PDFs, and manage your first client workspace for free.',
    }
  ],
  growth: [
    {
      q: 'How does the Growth mode help build stable income?',
      a: 'Growth mode includes pipeline CRM features, lead capture forms on your public profile, interactive proposals with milestone signatures, and automated billing rules for repeat clients.',
    },
    {
      q: 'How does the lead capture and CRM pipeline work?',
      a: 'When clients visit your public profile, they can submit quote requests. These inquiries flow directly into your CRM Kanban board as new inbound leads, allowing you to track them from pitch to payment.',
    },
    {
      q: 'Can I set up recurring retainers in Growth?',
      a: 'Yes, Growth is built for professional freelancers who need to secure repeat work and manage ongoing monthly or milestone retainers.',
    }
  ],
  studio: [
    {
      q: 'How does Studio support running an agency?',
      a: 'Studio provides an Agency Command Center. It features team roster presentations, custom brand kits, white-labeled client portals, outcome case studies, and advanced budget qualification filters.',
    },
    {
      q: 'Can I invite team members and specialists to my Studio workspace?',
      a: 'Yes, you can define specialist team roles and display them on your public agency profile, as well as coordinate delivery milestones across projects.',
    },
    {
      q: 'How does the multi-step inquiry budget qualification work?',
      a: 'Studio lets you set minimum project budgets (e.g., >$5,000 only) on your intake form, ensuring you only spend time scoping high-value qualified leads.',
    }
  ]
};





function ProductPreview() {
  const steps = [
    { icon: '🎯', label: 'Lead', text: 'Inbound Web Design Request', badge: 'New' },
    { icon: '📝', label: 'Proposal', text: '$3,000 Milestone Proposal', badge: 'Drafted' },
    { icon: '✨', label: 'AI Suggestion', text: 'Optimized to $3,200 rate', badge: 'Optimized' },
    { icon: '🤝', label: 'Accepted', text: 'Client signs proposal', badge: 'Contract Active' },
    { icon: '✉️', label: 'Invoice Sent', text: 'Payment link delivered', badge: 'Pending' },
    { icon: '💰', label: 'Paid', text: 'Stripe transfer processed', badge: 'Received' },
    { icon: '📈', label: 'Outcome', text: 'Wallet balance updated', badge: '+$3,200', isOutcome: true }
  ];

  return (
    <div className="hero-product-card" aria-label="Corvioz Freelancer OS product preview" style={{ maxWidth: '1200px', width: '100%', border: '1px solid var(--border)' }}>
      <div className="product-topbar">
        <div className="window-dots"><span /><span /><span /></div>
        <span>corvioz.com/workspace/pipeline</span>
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
        <div style={{
          position: 'absolute',
          bottom: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(5, 5, 6, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: '99px',
          padding: '6px 18px',
          color: 'var(--text-soft)',
          fontSize: '0.78rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 5,
          whiteSpace: 'nowrap'
        }}>
          <span>⚡</span>
          <span>Subtle automated lifecycle. Watch Corvioz sync leads to outcomes in real-time.</span>
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

function IdentityGate({ onSelect, currentIdentity }) {
  const [hoveredId, setHoveredId] = useState(null);
  const options = [
    {
      id: 'starter',
      title: 'Starter',
      tagline: 'Get Your First Client',
      desc: 'A direct outcome-based loop designed for new freelancers. Pitch milestone estimates, invoice billings, and clear payments with zero fluff.',
      accent: 'var(--primary)',
      bgGlow: 'var(--primary-glow)',
      icon: '⚡'
    },
    {
      id: 'growth',
      title: 'Growth',
      tagline: 'Build Stable Freelance Income',
      desc: 'A complete freelance operating system. Scale from capturing inbound CRM leads to proposing milestone scopes and securing repeat contracts.',
      accent: 'var(--success)',
      bgGlow: 'rgba(34, 197, 94, 0.08)',
      icon: '📈'
    },
    {
      id: 'studio',
      title: 'Studio',
      tagline: 'Run Your Agency',
      desc: 'An agency command center. White-labeled brand kits, case studies library, dynamic outcome metrics, specialists team, and multi-step budget qualification scoping.',
      accent: 'var(--accent)',
      bgGlow: 'rgba(99, 102, 241, 0.08)',
      icon: '🚀'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      maxWidth: '980px',
      width: '100%',
      margin: '0 auto 48px auto',
      padding: '0 20px',
      boxSizing: 'border-box'
    }}>
      {options.map((opt) => {
        const isSelected = currentIdentity === opt.id;
        const isHovered = hoveredId === opt.id;
        return (
          <div
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            onMouseEnter={() => setHoveredId(opt.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="hover-glow"
            style={{
              background: 'var(--bg-surface)',
              border: isSelected 
                ? `2px solid ${opt.accent}` 
                : isHovered 
                ? '2px solid var(--border-hover)' 
                : '2px solid var(--border)',
              borderRadius: '24px',
              padding: '36px 28px',
              cursor: 'pointer',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: isSelected 
                ? `0 20px 40px -12px ${opt.bgGlow}, 0 0 0 4px ${opt.bgGlow}` 
                : isHovered 
                ? '0 12px 24px -8px rgba(0,0,0,0.15)' 
                : 'var(--shadow-sm)',
              transform: isSelected 
                ? 'scale(1.03) translateY(-4px)' 
                : isHovered 
                ? 'scale(1.01) translateY(-2px)' 
                : 'scale(1) translateY(0)'
            }}
          >
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: opt.bgGlow,
                color: opt.accent,
                fontSize: '1.35rem',
                border: `1.5px solid ${opt.accent}`,
                marginBottom: '24px',
                transition: 'transform 0.3s ease',
                transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'none'
              }}>
                {opt.icon}
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 850, 
                textTransform: 'uppercase', 
                color: opt.accent, 
                letterSpacing: '0.1em', 
                display: 'block', 
                marginBottom: '8px' 
              }}>
                {opt.title} Identity
              </span>
              <h3 style={{ 
                fontSize: '1.4rem', 
                fontWeight: 900, 
                margin: '0 0 12px 0', 
                color: 'var(--text-main)',
                lineHeight: 1.25,
                letterSpacing: '-0.3px'
              }}>
                {opt.tagline}
              </h3>
              <p style={{ 
                fontSize: '0.88rem', 
                color: 'var(--text-muted)', 
                lineHeight: 1.55, 
                margin: 0 
              }}>
                {opt.desc}
              </p>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <button 
                type="button" 
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: isSelected 
                    ? opt.accent 
                    : isHovered 
                    ? 'var(--bg-card-hover)' 
                    : 'var(--btn-secondary-bg)',
                  color: isSelected 
                    ? '#ffffff' 
                    : isHovered 
                    ? 'var(--text-main)' 
                    : 'var(--text-soft)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  border: isSelected ? 'none' : '1px solid var(--border)',
                  boxShadow: isSelected ? `0 4px 12px ${opt.bgGlow}` : 'none'
                }}
              >
                {isSelected ? '✓ Active Mode' : 'Select Mode'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' or 'yearly'
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [identity, setIdentity] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [ui, setUi] = useState(() => CorviozKernel.compute('homepage'));

  useEffect(() => {
    setMounted(true);
    trackLandingViewed({ source: 'homepage' });
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('corvioz_identity');
      if (stored && ['starter', 'growth', 'studio'].includes(stored)) {
        setIdentity(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      setUi(CorviozKernel.compute('homepage'));
    }
    const handleUpdate = () => {
      setUi(CorviozKernel.compute('homepage'));
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('corvioz_debug_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('corvioz_debug_update', handleUpdate);
    };
  }, [identity, mounted]);

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
          {mounted && (
            <>
              <a href={ui.identity ? "#features" : "#why-corvioz"} className="nav-link">
                {ui.identity ? "Features" : "Why Corvioz"}
              </a>
              <a href={ui.identity ? "#how-it-works" : "#how-corvioz-works"} className="nav-link">
                How it works
              </a>
              {ui.identity ? (
                <a href="#pricing" className="nav-link" onClick={() => { trackPricingClick({ position: 'navbar' }); trackEvent('pricing_click', { position: 'navbar' }); trackEvent('pricing_click_intent', { source: 'navbar_anchor' }); }}>Pricing</a>
              ) : (
                <a href="#identity-switcher" className="nav-link">Operating Modes</a>
              )}
              {ui.identity && <a href="#resources" className="nav-link">Resources</a>}
            </>
          )}
          
          {mounted && ui.identity && (
            <button
              onClick={() => {
                setIdentity(null);
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('corvioz_identity');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: ui.identity === 'starter' 
                  ? 'var(--primary-glow)' 
                  : ui.identity === 'growth' 
                  ? 'rgba(34, 197, 94, 0.08)' 
                  : 'rgba(99, 102, 241, 0.08)',
                color: ui.identity === 'starter' 
                  ? 'var(--primary)' 
                  : ui.identity === 'growth' 
                  ? 'var(--success)' 
                  : 'var(--accent)',
                border: `1.5px solid ${
                  ui.identity === 'starter' 
                    ? 'var(--primary)' 
                    : ui.identity === 'growth' 
                    ? 'var(--success)' 
                    : 'var(--accent)'
                }`,
                padding: '4px 14px',
                borderRadius: '99px',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                marginRight: '8px'
              }}
              title="Click to switch identity mode"
            >
              <span>Mode: {ui.identity === 'starter' ? 'Starter' : ui.identity === 'growth' ? 'Growth' : 'Studio'}</span>
              <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>✕</span>
            </button>
          )}

          <Button href="/dashboard" variant="secondary" size="sm" onClick={() => trackEvent('cta_click', { cta_name: 'Sign in', position: 'navbar' })}>Sign in</Button>
          {mounted && (
            <Button
              href={ui.identity ? "/invoices/create" : "/signup"}
              variant="primary"
              size="sm"
              onClick={() => {
                if (ui.identity) {
                  saveIntendedRoute('/invoices/create', '/');
                  trackEvent('signup_click', { position: 'navbar' });
                  trackEvent('cta_click', { cta_name: ui.cta('navbar'), position: 'navbar' });
                } else {
                  saveIntendedRoute('/dashboard', '/');
                  trackEvent('signup_click', { position: 'navbar' });
                  trackEvent('cta_click', { cta_name: 'Join Free', position: 'navbar' });
                }
              }}
              style={{
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                fontWeight: 700
              }}
            >
              {ui.identity ? ui.cta('navbar') : 'Join Free'}
            </Button>
          )}
          <ThemeToggle />
        </div>
        <div className="mobile-nav-actions">
          {mounted && ui.identity && (
            <button
              onClick={() => {
                setIdentity(null);
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('corvioz_identity');
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: ui.identity === 'starter' 
                  ? 'var(--primary-glow)' 
                  : ui.identity === 'growth' 
                  ? 'rgba(34, 197, 94, 0.08)' 
                  : 'rgba(99, 102, 241, 0.08)',
                color: ui.identity === 'starter' 
                  ? 'var(--primary)' 
                  : ui.identity === 'growth' 
                  ? 'var(--success)' 
                  : 'var(--accent)',
                border: `1.5px solid ${
                  ui.identity === 'starter' 
                    ? 'var(--primary)' 
                    : ui.identity === 'growth' 
                    ? 'var(--success)' 
                    : 'var(--accent)'
                }`,
                padding: '3px 10px',
                borderRadius: '99px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                marginRight: '8px'
              }}
            >
              <span>{ui.identity === 'starter' ? 'Starter' : ui.identity === 'growth' ? 'Growth' : 'Studio'}</span>
              <span>✕</span>
            </button>
          )}
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
            {mounted && (
              <>
                <a href={ui.identity ? "#features" : "#why-corvioz"} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  {ui.identity ? "Features" : "Why Corvioz"}
                </a>
                <a href={ui.identity ? "#how-it-works" : "#how-corvioz-works"} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  How it works
                </a>
                {ui.identity ? (
                  <a href="#pricing" className="mobile-nav-link" onClick={() => { setMobileMenuOpen(false); trackPricingClick({ position: 'mobile_menu' }); trackEvent('pricing_click', { position: 'mobile_menu' }); trackEvent('pricing_click_intent', { source: 'mobile_menu_anchor' }); }}>Pricing</a>
                ) : (
                  <a href="#identity-switcher" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
                )}
                {ui.identity && <a href="#resources" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Resources</a>}
                <div className="mobile-menu-divider" />
              </>
            )}
            <Button href="/dashboard" variant="secondary" style={{ width: '100%' }} onClick={() => { setMobileMenuOpen(false); trackEvent('cta_click', { cta_name: 'Sign in', position: 'mobile_menu' }); }}>Sign in</Button>
            {mounted && (
              <Button 
                href={ui.identity ? "/invoices/create" : "/signup"} 
                variant="primary" 
                style={{ width: '100%', marginTop: '8px', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }} 
                onClick={() => { 
                  setMobileMenuOpen(false); 
                  if (ui.identity) {
                    saveIntendedRoute('/invoices/create', '/'); 
                    trackEvent('signup_click', { position: 'mobile_menu' }); 
                    trackEvent('cta_click', { cta_name: ui.cta('navbar'), position: 'mobile_menu' }); 
                  } else {
                    saveIntendedRoute('/dashboard', '/');
                    trackEvent('signup_click', { position: 'mobile_menu' });
                    trackEvent('cta_click', { cta_name: 'Join Free', position: 'mobile_menu' });
                  }
                }}
              >
                {ui.identity ? ui.cta('navbar') : 'Join Free'}
              </Button>
            )}
          </div>
        )}
      </nav>

      {!(mounted && ui.identity !== null) ? (
        /* Identity Selector Mode (null State) */
        <>
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
                Win Clients. Send Better Proposals.<br />
                <span className="glow-gradient-text" style={{ fontWeight: 900 }}>Get Paid Faster.</span>
              </h1>
              <p style={{ fontSize: '1.18rem', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '680px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                Corvioz is the dedicated operating system for independent freelancers. Command your client pipeline, pitch stunning proposals, and accelerate invoice payouts in one unified workspace.
              </p>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                flexWrap: 'wrap',
                marginTop: '12px',
                marginBottom: '36px'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                  Win Clients
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                  Send Better Proposals
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                  Get Paid Faster
                </span>
              </div>

              <div className="hero-actions" style={{ justifyContent: 'center', marginBottom: '24px', gap: '16px' }}>
                <Button
                  href="/early-access"
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    saveIntendedRoute('/dashboard', '/');
                    trackHeroCtaClick({ cta_name: 'Join Early Access — Free', position: 'hero' });
                    trackEvent('cta_click', { cta_name: 'Join Early Access — Free', position: 'hero' });
                  }}
                  style={{ padding: '16px 36px', fontSize: '1rem', fontWeight: 900, borderRadius: '99px', transition: 'all 0.3s ease', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35)' }}
                >
                  Join Early Access — Free
                </Button>
                <Button
                  href="/demo"
                  variant="secondary"
                  size="lg"
                  onClick={() => { trackHeroCtaClick({ cta_name: 'Explore the Demo', position: 'hero' }); trackEvent('cta_click', { cta_name: 'Explore the Demo', position: 'hero' }); }}
                  style={{ padding: '16px 30px', fontSize: '1rem', fontWeight: 800, borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', transition: 'all 0.3s ease' }}
                >
                  Explore the Demo
                </Button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                <span>✓ No credit card required</span>
                <span>✓ Free during Early Access</span>
                <span>✓ Built with real freelancer feedback</span>
              </div>
	            </div>
	          </header>

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

	          <IdentityGate
            currentIdentity={identity}
            onSelect={(id) => {
              setIdentity(id);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('corvioz_identity', id);
              }
            }}
          />

          {/* Why Corvioz Value Stack & Trust Section for first-time visitors */}
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
        </>
      ) : (
        /* Active Showcase / Operating Mode */
        <>
          <header className="landing-hero" style={{ minHeight: '70vh', paddingBottom: '48px' }}>
            <div className="hero-shell" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
              <div className="hero-copy animate-fade-in" style={{ textAlign: 'center' }}>
                {/* Trust badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: ui.pricing_variant === 'starter' ? 'var(--primary-glow)' : ui.pricing_variant === 'growth' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                  border: `1px solid ${ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'growth' ? 'var(--success)' : 'var(--accent)'}`,
                  borderRadius: '99px',
                  padding: '4px 14px',
                  fontSize: '0.75rem',
                  color: ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'growth' ? 'var(--success)' : 'var(--accent)',
                  fontWeight: 600,
                  marginBottom: '24px'
                }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'growth' ? 'var(--success)' : 'var(--accent)' }} />
                  Early Access for Freelancers
                </div>
                <h1 style={{ fontSize: 'clamp(2.3rem, 6vw, 4.2rem)', lineHeight: 1.15, marginBottom: '20px', letterSpacing: '-0.03em', fontWeight: 800 }}>
                  Win Clients. Send Better Proposals.<br />
                  <span className="glow-gradient-text" style={{ fontWeight: 900 }}>Get Paid Faster.</span>
                </h1>
                <p style={{ fontSize: '1.18rem', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '680px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  Corvioz is the dedicated operating system for independent freelancers. Command your client pipeline, pitch stunning proposals, and accelerate invoice payouts in one unified workspace.
                </p>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  flexWrap: 'wrap',
                  marginTop: '12px',
                  marginBottom: '36px'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                    Win Clients
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                    Send Better Proposals
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</span>
                    Get Paid Faster
                  </span>
                </div>

                <div className="hero-actions" style={{ justifyContent: 'center', marginBottom: '24px', gap: '16px' }}>
                  <Button
                    href="/early-access"
                    variant="primary"
                    size="lg"
                    onClick={() => { 
                      saveIntendedRoute('/dashboard', '/'); 
                      trackHeroCtaClick({ cta_name: 'Join Early Access — Free', position: 'hero' });
                      trackEvent('cta_click', { cta_name: 'Join Early Access — Free', position: 'hero' }); 
                    }}
                    style={{ padding: '16px 36px', fontSize: '1rem', fontWeight: 900, borderRadius: '99px', transition: 'all 0.3s ease', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.35)' }}
                  >
                    Join Early Access — Free
                  </Button>
                  <Button
                    href="/demo"
                    variant="secondary"
                    size="lg"
                    onClick={() => { trackHeroCtaClick({ cta_name: 'Explore the Demo', position: 'hero' }); trackEvent('cta_click', { cta_name: 'Explore the Demo', position: 'hero' }); }}
                    style={{ padding: '16px 30px', fontSize: '1rem', fontWeight: 800, borderRadius: '99px', border: '1px solid var(--border)', background: 'transparent', transition: 'all 0.3s ease' }}
                  >
                    Explore the Demo
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '32px', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                  <span>✓ No credit card required</span>
                  <span>✓ Free during Early Access</span>
                  <span>✓ Built with real freelancer feedback</span>
                </div>
	              </div>
            </div>

            {/* Interactive product mockup preview */}
            <div style={{ maxWidth: '1200px', margin: '48px auto 0 auto', width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }} className="animate-fade-in">
              <ProductPreview />
            </div>
          </header>

	          {/* How Corvioz Works */}
	          <Section id="how-it-works" style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
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

          {/* Trust System / Visual Previews & Beta traction */}
          <Section id="trust" containerStyle={{ maxWidth: '1120px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p className="section-kicker">Platform Integrity & Previews</p>
              <h2 className="section-title">Verified Visual Previews</h2>
              <p className="section-lede">Explore the visual structure and interface layouts of the Corvioz workspace. No fake testimonials, no mock logos—just real product outlines.</p>
            </div>
            
            {/* Traction Stat Cards */}
            <div className="trust-stats-grid">
              <Card style={{ padding: '28px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(99, 102, 241, 0.02)' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Development Stage</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--text-main)' }}>🚀 Early Beta Access</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
                  We are building in public. Corvioz is currently in Early Beta with a community-first feedback cycle. Every feature and workflow optimization is driven directly by active independent freelancers.
                </p>
              </Card>
              <Card style={{ padding: '28px', border: '1px solid rgba(34, 197, 94, 0.2)', background: 'rgba(34, 197, 94, 0.02)' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--success-text)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Traction Metrics</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 10px 0', color: 'var(--text-main)' }}>📈 Growing Every Week</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
                  Active freelancer pipeline volume is expanding weekly. We ship weekly improvements to proposals, white-labeled client portals, and payment collection speeds to simplify independent billing operations.
                </p>
              </Card>
            </div>

            {/* Product illustration gallery */}
            <div className="screenshot-gallery-grid">
              {/* Card 1: Dashboard */}
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

              {/* Card 2: Proposal */}
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

              {/* Card 3: Invoice */}
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

              {/* Card 4: Client Portal */}
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

          {/* Features */}
          <Section id="features" style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '1120px' }}>
            <div style={{ textAlign: 'center', marginBottom: '44px' }}>
              <p className="section-kicker">Features</p>
              <h2 className="section-title">
                {ui.copy.featuresTitle}
              </h2>
              <p className="section-lede">
                {ui.copy.featuresLede}
              </p>
            </div>
            <div className="feature-overview-grid">
              {ui.copy.featuresList.map((feature) => (
                <Card key={feature.title} className="feature-overview-card">
                  <span>Corvioz</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* Public Profile */}
          <Section id="profile" containerStyle={{ maxWidth: '1120px' }}>
            <div className="split-section">
              <div>
                <p className="section-kicker">Public Profile</p>
                <h2>
                  {ui.copy.profileTitle}
                </h2>
                <p>
                  {ui.copy.profileLede}
                </p>
                <div className="point-list">
                  {ui.copy.profileBullets.map((bullet, idx) => (
                    <span key={idx}>{bullet}</span>
                  ))}
                </div>
                <div className="hero-actions" style={{ marginTop: '28px' }}>
                  <Button href="/dashboard?action=create-profile" variant="primary" size="lg" onClick={() => { saveIntendedRoute('/dashboard?action=create-profile', '/'); trackEvent('cta_click', { cta_name: ui.cta('onboarding_primary'), position: 'profile_section' }); }}>{ui.cta('onboarding_primary')}</Button>
                  <Button href="/freelancers" variant="secondary" size="lg">Browse Profiles</Button>
                </div>
              </div>
              <div className="feature-panel">
                <div className="panel-header">
                  <span className="logo-wordmark" style={{ fontSize: '0.95rem', fontWeight: 900, letterSpacing: '-0.035em' }}>Corvioz</span>
                  <span>corvioz.com/profile/yourname</span>
                </div>
                <div className="panel-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="panel-card">
                  <strong>New quote request</strong>
                  <p>A client discovered your services, reviewed your profile, and requested a project estimate.</p>
                </div>
              </div>
            </div>
          </Section>

          {ui.identity === 'starter' && (
            <Section id="starter-showcase" containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
              <p className="section-kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Starter Product OS</p>
              <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '16px' }}>
                {ui.copy.showcaseTitle}
              </h2>
              <p className="section-lede" style={{ maxWidth: '640px', margin: '0 auto 40px auto', fontSize: '1.05rem', color: 'var(--text-soft)' }}>
                {ui.copy.showcaseLede}
              </p>

              {/* Connected horizontal timeline */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '48px',
                flexWrap: 'wrap'
              }}>
                {[
                  { step: '1', title: 'Quote', desc: 'Draft milestone estimates' },
                  { step: '2', title: 'Invoice', desc: 'Convert to bills instantly' },
                  { step: '3', title: 'Paid', desc: 'Secure card payments' }
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--border)', flexShrink: 0 }} className="desktop-only" />}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '99px',
                      padding: '8px 24px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'var(--primary-glow)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        border: '1.5px solid var(--primary)'
                      }}>{item.step}</div>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Outcome Loop cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '24px',
                alignItems: 'stretch',
                marginBottom: '40px'
              }}>
                {[
                  {
                    step: '1',
                    title: 'Quote',
                    description: 'Draft milestone-based estimates. Present polished scopes that align client expectations.',
                    badge: 'Outcome Loop Start',
                    color: 'var(--primary)',
                    glow: 'var(--primary-glow)'
                  },
                  {
                    step: '2',
                    title: 'Invoice',
                    description: 'Convert accepted estimates into bills instantly. Export clean copies with secure terms.',
                    badge: 'Conversion Point',
                    color: 'var(--accent)',
                    glow: 'rgba(99, 102, 241, 0.08)'
                  },
                  {
                    step: '3',
                    title: 'Paid',
                    description: 'Track client transactions in real-time. Secured workspace links make payment friction-free.',
                    badge: 'First Value Succeeded',
                    color: 'var(--success)',
                    glow: 'var(--success-glow)'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="card" style={{
                    padding: '32px 24px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    position: 'relative'
                  }}>
                    <div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: item.glow,
                        color: item.color,
                        fontWeight: 800,
                        fontSize: '1rem',
                        border: `1.5px solid ${item.color}`,
                        marginBottom: '20px'
                      }}>
                        {item.step}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                        {item.description}
                      </p>
                    </div>
                    <div style={{
                      marginTop: '20px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: item.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {item.badge}
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic loop connector info line */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                background: 'var(--btn-secondary-bg)',
                border: '1px solid var(--border)',
                borderRadius: '99px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}>
                <span>Outcome Pipeline:</span>
                <span style={{ color: 'var(--primary)' }}>Quote</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--accent)' }}>Invoice</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--success)' }}>Paid</span>
              </div>
            </Section>
          )}

          {ui.identity === 'growth' && (
            <Section id="growth-showcase" containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
              <p className="section-kicker" style={{ color: 'var(--success)', fontWeight: 800 }}>Growth OS</p>
              <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '16px' }}>
                {ui.copy.showcaseTitle}
              </h2>
              <p className="section-lede" style={{ maxWidth: '640px', margin: '0 auto 40px auto', fontSize: '1.05rem', color: 'var(--text-soft)' }}>
                {ui.copy.showcaseLede}
              </p>

              {/* CRM Kanban Board visual layout */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                alignItems: 'stretch',
                marginBottom: '40px',
                textAlign: 'left'
              }}>
                {[
                  {
                    title: '1. Lead Capture',
                    cardTitle: 'Brand Identity Redesign',
                    cardValue: '$2,400',
                    cardStatus: 'New Inbound',
                    color: 'var(--primary)',
                    glow: 'var(--primary-glow)'
                  },
                  {
                    title: '2. Proposal Scope',
                    cardTitle: 'Milestone Pitch Draft',
                    cardValue: '3 stages proposed',
                    cardStatus: 'Awaiting Signature',
                    color: 'var(--accent)',
                    glow: 'rgba(99, 102, 241, 0.08)'
                  },
                  {
                    title: '3. CRM Contract',
                    cardTitle: 'Acme Corp Signed Portal',
                    cardValue: '$2,400 contract won',
                    cardStatus: 'Milestone 1 Active',
                    color: 'var(--success)',
                    glow: 'var(--success-glow)'
                  },
                  {
                    title: '4. Settle & Repeat',
                    cardTitle: 'Q3 Retainer Agreement',
                    cardValue: '$1,200/mo retainer',
                    cardStatus: 'Repeat Business',
                    color: '#3b82f6',
                    glow: 'rgba(59, 130, 246, 0.08)'
                  }
                ].map((col, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: col.color }} />
                      {col.title}
                    </h4>
                    
                    {/* Mock Kanban Card */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: `1.5px solid ${col.color}`,
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: col.color, fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {col.cardStatus}
                      </div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {col.cardTitle}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {col.cardValue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Outcome loop connector info line */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                background: 'var(--btn-secondary-bg)',
                border: '1px solid var(--border)',
                borderRadius: '99px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span>Outcome Pipeline:</span>
                <span style={{ color: 'var(--primary)' }}>Lead</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--accent)' }}>Proposal</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--success)' }}>Invoice</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: '#3b82f6' }}>Repeat Client</span>
              </div>
            </Section>
          )}

          {ui.identity === 'studio' && (
            <Section id="studio-showcase" containerStyle={{ maxWidth: '980px', textAlign: 'center' }}>
              <p className="section-kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Studio OS</p>
              <h2 className="section-title" style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '16px' }}>
                {ui.copy.showcaseTitle}
              </h2>
              <p className="section-lede" style={{ maxWidth: '640px', margin: '0 auto 40px auto', fontSize: '1.05rem', color: 'var(--text-soft)' }}>
                {ui.copy.showcaseLede}
              </p>

              {/* Mock Dashboard split layout */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--accent)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '40px',
                textAlign: 'left',
                boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.15)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-main)' }}>Agency Command Center</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--btn-secondary-bg)', padding: '4px 10px', borderRadius: '4px' }}>White-Labeled Domain</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '20px' }} className="desktop-only">
                  {/* Left Column: Team Display */}
                  <div style={{ borderRight: '1px solid var(--border)', paddingRight: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specialist Team</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { name: 'Sarah L.', role: 'Lead Design Specialist', status: 'Active' },
                        { name: 'David K.', role: 'Dev Consultant', status: 'Active' },
                        { name: 'You (Operator)', role: 'Agency Owner', status: 'Owner' }
                      ].map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{t.name[0]}</div>
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{t.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Middle Column: Active Workspaces */}
                  <div style={{ borderRight: '1px solid var(--border)', paddingRight: '16px', paddingLeft: '8px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Workspaces</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { client: 'Globex Corp Portal', progress: '75%', color: 'var(--primary)' },
                        { client: 'Wayne Enterprise Hub', progress: '40%', color: 'var(--accent)' }
                      ].map((w, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>{w.client}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.progress}</span>
                          </div>
                          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: w.progress, height: '100%', backgroundColor: w.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Case Studies & Qualifiers */}
                  <div>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outcome Metrics</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--success-text)', textTransform: 'uppercase', display: 'block', fontWeight: 800 }}>Inquiry Budget Filter</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>&gt; $5,000 only</strong>
                      </div>
                      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '10px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', fontWeight: 800 }}>Avg Project Velocity</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>14 days to close</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mobile-only" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
                  💻 Switch to a larger screen to preview the Agency Command Center Workspace interface.
                </div>
              </div>

              {/* Outcome loop connector info line */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 24px',
                background: 'var(--btn-secondary-bg)',
                border: '1px solid var(--border)',
                borderRadius: '99px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <span>Outcome Pipeline:</span>
                <span style={{ color: 'var(--primary)' }}>Clients</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--accent)' }}>Delivery</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--success)' }}>Brand</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: '#3b82f6' }}>Scale</span>
              </div>
            </Section>
          )}

          {/* Identity Gate placement ABOVE pricing */}
          <Section id="identity-switcher" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} containerStyle={{ maxWidth: '1120px', textAlign: 'center' }}>
            <p className="section-kicker">Operating Mode</p>
            <h2 className="section-title">Select Your Operating Identity</h2>
            <p className="section-lede" style={{ marginBottom: '40px' }}>
              Switch between identity systems below to instantly preview layouts and workflows.
            </p>
            <IdentityGate
              currentIdentity={ui.identity}
              onSelect={(id) => {
                setIdentity(id);
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('corvioz_identity', id);
                }
              }}
            />
          </Section>

          {/* Pricing */}
	          <Section id="pricing" containerStyle={{ maxWidth: '1120px', textAlign: 'center' }}>
	            <p className="section-kicker">Pricing</p>
	            <h2 className="section-title">Pick your mode.</h2>
	            <p className="section-lede" style={{ marginBottom: '24px' }}>Start free. Upgrade only when Corvioz becomes part of your workflow.</p>

            {/* Identity Ladder — 4 tiers */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '99px', overflow: 'hidden', fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{ padding: '8px 14px', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>Free &nbsp;<span style={{ opacity: 0.6, fontWeight: 400 }}>→ Try</span></span>
                <span style={{ padding: '8px 14px', color: 'var(--primary)', background: 'var(--primary-glow)', borderRight: '1px solid var(--border)' }}>Pro &nbsp;<span style={{ opacity: 0.8, fontWeight: 400 }}>→ Earn</span></span>
                <span style={{ padding: '8px 14px', color: 'var(--success)', background: 'rgba(34,197,94,0.06)', borderRight: '1px solid var(--border)' }}>Growth &nbsp;<span style={{ opacity: 0.8, fontWeight: 400 }}>→ Expand</span></span>
                <span style={{ padding: '8px 14px', color: 'var(--text-soft)' }}>Studio &nbsp;<span style={{ opacity: 0.6, fontWeight: 400 }}>→ Scale</span></span>
              </div>
            </div>
            
            {/* Billing Period Toggle */}
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
              <>
                <div className="pricing-grid pricing-grid-three">
                {plans.map((plan) => {
                  const isFree = plan.id === 'free';
                  const isPro = plan.id === 'pro';
                  const isGrowth = plan.id === 'growth';
                  const isFeatured = plan.id === 'growth'; // Highlight the $19 Growth/Pro plan
                  
                  const price = billingPeriod === 'monthly' ? plan.price_monthly : plan.price_yearly;
                  const billedAnnuallyText = plan.price_yearly > 0 ? `billed annually as $${Math.round(plan.price_yearly * 12)}` : null;
                  
                  const ctaText = ui.cta(isFree ? 'pricing_free' : isPro ? 'pricing_pro' : isGrowth ? 'pricing_growth' : 'pricing_studio');
                  const hrefVal = isFree ? '/dashboard?action=create-profile' : `/pricing?checkout=${plan.id}`;

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
                          ⭐ Recommended (Best Value)
                        </div>
                      )}
                      <div>
                        <h3>{plan.name}</h3>
                        <div className="price-line" style={{ marginBottom: billingPeriod === 'yearly' && !isFree ? '8px' : '24px' }}>
                          <strong>{isFree ? '$0' : `$${price}`}</strong>
                          <span>{isFree ? '' : '/month'}</span>
                        </div>
                        {billingPeriod === 'yearly' && !isFree && billedAnnuallyText && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-12px', marginBottom: '20px', fontWeight: 600 }}>
                            {billedAnnuallyText}
                          </div>
                        )}
                        <p style={{ color: isFeatured ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {(mounted && ui.pricing?.cards?.[plan.id]?.outcome) || plan.description}
                        </p>
                        <ul>
                          {((mounted && ui.pricing?.cards?.[plan.id]?.features) || plan.features).map((feature) => (
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
                            if (isFree) {
                              trackEvent('signup_click', { position: 'homepage_pricing_card' });
                            }
                            trackEvent('cta_click', { cta_name: ctaText, position: 'pricing_card', plan: planKey });
                          }}
                        >
                          {ctaText}
                        </Button>

                        {/* Trust Microcopy */}
                        {plan.id === 'pro' && (
                          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                            {mounted && ui.pricing?.cardTrustMicrocopy}
                          </p>
                        )}
                        {plan.id === 'growth' && (
                          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                            {mounted && ui.pricing?.cardTrustMicrocopy}
                          </p>
                        )}
                        {(plan.id === 'studio' || plan.id === 'agency') && (
                          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                            {mounted && ui.pricing?.cardTrustMicrocopy}
                          </p>
                        )}

                        {/* Policy Agreement Inline Link */}
                        {!isFree && (
                          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            By continuing, you agree to our <Link href="/terms" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Terms</Link> & <Link href="/privacy" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Privacy Policy</Link>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Trust Strip */}
              {mounted && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px 32px',
                  marginTop: '40px',
                  width: '100%',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center'
                }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
                    {ui.pricing?.trustStripTitle}
                  </h3>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '16px 32px',
                  }}>
                    {ui.pricing?.trustStripBullets?.map((bullet, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600 }}>
                        <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
            )}
          </Section>

          {/* Resources */}
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

          {/* FAQ */}
          <Section id="faq" containerStyle={{ maxWidth: '860px', textAlign: 'center' }}>
            <p className="section-kicker">FAQ</p>
            <h2 className="section-title">Common Questions</h2>
            <div className="faq-list">
              {ui.copy?.faqs?.map((item, idx) => (
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

          {/* Trust & Transparency / Founder Note Section */}
          <Section id="transparency" containerStyle={{ maxWidth: '980px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', textAlign: 'left' }}>
              {/* Founder Note */}
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

              {/* Privacy & Transparency */}
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

          {/* Final CTA */}
          <Section id="final-cta" style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ maxWidth: '840px', textAlign: 'center' }}>
            <p className="section-kicker">
              {ui.copy.trustBadge}
            </p>
            <h2 className="section-title">
              {ui.copy.headline}
            </h2>
            <p className="section-lede">
              {ui.copy.lede}
            </p>
            <div className="hero-actions center" style={{ marginBottom: '8px' }}>
              <Button 
                href="/invoices/create" 
                variant="primary" 
                size="lg" 
                onClick={() => { 
                  saveIntendedRoute('/invoices/create', '/'); 
                  trackEvent('invoice_create_click', { position: 'final_cta' }); 
                  trackEvent('cta_click', { 
                    cta_name: ui.cta('onboarding_primary'), 
                    position: 'final_cta' 
                  }); 
                }}
              >
                {ui.cta('onboarding_primary')}
              </Button>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
              {ui.copy.trustMicrocopy}
            </p>
          </Section>
        </>
      )}

      {/* Footer is only visible when identity is selected */}
      {mounted && ui.identity !== null && (
        <footer className="landing-footer landing-footer-grid">
          <div>
            <Logo />
            <p>
              {ui.copy.headline}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>Built for Freelancers in Beta</p>
          </div>
          <div>
            <strong>Product</strong>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing" onClick={() => { trackPricingClick({ position: 'footer' }); trackEvent('pricing_click', { position: 'footer' }); trackEvent('pricing_click_intent', { source: 'footer_anchor' }); }}>Pricing</a>
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
            <Link href="/client">Client portal</Link>
            <Link href="/dashboard">Sign in</Link>
          </div>
          <div>
            <strong>Legal</strong>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/security">Security & Data</Link>
          </div>

          {/* Global Footer Trust & Badges */}
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
              {ui.copy.trustMicrocopy}
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 550
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🔒 {ui.copy.trustMicrocopy}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🇪🇺 GDPR Ready</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💳 Secure Payments</span>
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
