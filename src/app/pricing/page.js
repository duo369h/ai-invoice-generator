// This is not a feature mapping system.
// This is a behavioral revenue system.
// Pricing is driven by user intent, not functionality.

'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import { Button, Logo } from '../components/UIComponents';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { loadPaddleScript } from '../lib/paddle-client';
import { sendEvent as trackEvent } from '../lib/analytics';
import { trackPricingClick } from '../lib/product-analytics';
import { saveSelectedPlan, saveIntendedRoute } from '../lib/intent-store';
import { useUserSubscription } from '../../hooks/useUserSubscription';
import { trackPricingView } from 'lib/monetization/revenueEvents';
import { validateUIDecisionIsolation } from 'lib/execution/strict';
import { getPricingViewModel } from './viewModel';
import { handleUpgradeCheckout } from './controller';
import { validatePricingIsolation } from '../../core/pricing/pricingIsolationGuard';
import { trackIntentAction, getIntentLevel } from 'lib/revenue/intentTracker';
import { trackFunnelEvent } from 'lib/revenue/funnelTracker';
import { getUIInjection } from 'lib/revenue/uiInjection';
import { getPricingPressure } from 'lib/revenue/pressureEngine';
import { CorviozKernel } from 'lib/kernel/corviozKernel';

const STRICT_PLAN_IDS = ['free', 'starter', 'pro', 'studio'];

function normalizePricingPlans(rawPlans) {
  if (!Array.isArray(rawPlans)) return [];
  const uniquePlansMap = new Map();
  rawPlans.forEach((plan) => {
    if (plan && plan.id && !uniquePlansMap.has(plan.id)) {
      uniquePlansMap.set(plan.id, plan);
    }
  });
  return STRICT_PLAN_IDS
    .map((id) => uniquePlansMap.get(id))
    .filter(Boolean);
}

function IdentityGate({ onSelect, currentIdentity }) {
  const options = [
    {
      id: 'starter',
      title: 'Starter',
      tagline: 'Get paid faster',
      desc: 'A direct outcome-based loop designed for new freelancers. Pitch milestone estimates, invoice billings, and clear payments with zero fluff.',
      accent: 'var(--primary)',
      bgGlow: 'var(--primary-glow)',
      icon: '⚡'
    },
    {
      id: 'pro',
      title: 'Pro',
      tagline: 'Never miss a payment',
      desc: 'A complete freelance business operating system. Scale from capturing inbound CRM leads to proposing scopes and repeat business.',
      accent: 'var(--success)',
      bgGlow: 'rgba(34, 197, 94, 0.08)',
      icon: '📈'
    },
    {
      id: 'studio',
      title: 'Studio',
      tagline: 'Scale client operations',
      desc: 'A studio command center. White-labeled brand kits, case studies library, dynamic outcome metrics, specialists team, and multi-step budget qualification scoping.',
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
      padding: '0 20px'
    }}>
      {options.map((opt) => {
        const isSelected = currentIdentity === opt.id;
        return (
          <div
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="hover-glow"
            style={{
              background: 'var(--bg-surface)',
              border: isSelected ? `2.5px solid ${opt.accent}` : '1.5px solid var(--border)',
              borderRadius: '20px',
              padding: '32px 24px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: isSelected 
                ? `0 20px 40px -12px ${opt.bgGlow}, 0 0 0 4px ${opt.bgGlow}` 
                : 'none',
              transform: isSelected ? 'scale(1.02) translateY(-2px)' : 'none'
            }}
          >
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: opt.bgGlow,
                color: opt.accent,
                fontSize: '1.25rem',
                border: `1.5px solid ${opt.accent}`,
                marginBottom: '20px'
              }}>
                {opt.icon}
              </div>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 850, 
                textTransform: 'uppercase', 
                color: opt.accent, 
                letterSpacing: '0.08em', 
                display: 'block', 
                marginBottom: '6px' 
              }}>
                {opt.title} Identity
              </span>
              <h3 style={{ 
                fontSize: '1.35rem', 
                fontWeight: 900, 
                margin: '0 0 12px 0', 
                color: 'var(--text-main)',
                lineHeight: 1.25 
              }}>
                {opt.tagline}
              </h3>
              <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)', 
                lineHeight: 1.5, 
                margin: 0 
              }}>
                {opt.desc}
              </p>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: isSelected ? opt.accent : 'var(--btn-secondary-bg)',
                  color: isSelected ? 'var(--white)' : 'var(--text-soft)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: isSelected ? 'none' : '1px solid var(--border)'
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



function PricingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutRestoredRef = useRef(false);
  const [billingPeriod, setBillingPeriod] = useState('yearly'); // 'monthly' or 'yearly'
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const { plan: userPlan, isLoading: subLoading, isAuthenticated } = useUserSubscription();

  const [identity, setIdentity] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [ui, setUi] = useState(() => CorviozKernel.compute('pricing'));

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('corvioz_identity');
      setIdentity(stored);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      setUi(CorviozKernel.compute('pricing'));
    }
    const handleUpdate = () => {
      setUi(CorviozKernel.compute('pricing'));
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('corvioz_debug_update', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('corvioz_debug_update', handleUpdate);
    };
  }, [identity, mounted]);

  // Enforce strict runtime boundary isolation
  validateUIDecisionIsolation('pricing');

  // Fetch plans from /api/pricing
  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.plans) {
            setPlans(normalizePricingPlans(data.plans));
          }
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err);
      } finally {
        if (active) setPlansLoading(false);
      }
    };
    fetchPlans();
    return () => {
      active = false;
    };
  }, []);

  // Enforce Pricing Isolation Guard
  validatePricingIsolation(session, userPlan, searchParams);

  // Generate view model from plans list and decision engine state
  const { cards: viewModels, upgradeBanner } = getPricingViewModel({
    plans,
    session,
    userPlan,
    isAuthenticated,
    subLoading
  });

  // Task 3: UI-level deduplication guard & fixed order
  const seenIds = new Set();
  const uniqueViewModels = [];
  const RENDER_ORDER = ['free', 'starter', 'pro', 'studio'];
  
  RENDER_ORDER.forEach((id) => {
    const vm = viewModels.find((v) => v.id === id);
    if (vm && !seenIds.has(vm.id)) {
      seenIds.add(vm.id);
      uniqueViewModels.push(vm);
    }
  });


  useEffect(() => {
    // Track intent & funnel events
    trackIntentAction('VIEW_PRICING');
    trackFunnelEvent('pricing_view');
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('corvioz_pricing_view', 'true');
    }

    let triggerSource = 'direct';
    if (typeof window !== 'undefined') {
      triggerSource = searchParams.get('source') || 'direct';
    }
    trackPricingView(triggerSource);
    trackPricingClick({ source: 'pricing_page_view', trigger_source: triggerSource });
    trackEvent('pro_upgrade_view', { source: 'pricing_page', trigger_source: triggerSource });
    trackEvent('studio_upgrade_view', { source: 'pricing_page', trigger_source: triggerSource });

    const trackedDepths = new Set();
    const handleScrollDepth = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      [25, 50, 75, 100].forEach((marker) => {
        if (depth >= marker && !trackedDepths.has(marker)) {
          trackedDepths.add(marker);
          trackEvent('pricing_scroll_depth', { depth_percent: marker });
        }
      });
    };
    window.addEventListener('scroll', handleScrollDepth, { passive: true });
    handleScrollDepth();
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        console.log('[INSTRUMENTATION] pricing loaded session:', data.session?.user?.id || 'null');
        setSession(data.session || null);
        setSessionLoaded(true);
      });
    } else {
      setSessionLoaded(true);
    }
    return () => window.removeEventListener('scroll', handleScrollDepth);
  }, [searchParams]);

  const onUpgradeClick = useCallback((planId) => {
    handleUpgradeCheckout({
      planId,
      billingPeriod,
      session,
      plans,
      searchParams,
      setCheckoutLoading
    });
  }, [billingPeriod, session, plans, searchParams]);

  useEffect(() => {
    if (!sessionLoaded || plans.length === 0) return;
    const checkoutPlan = searchParams.get('checkout');
    console.log('[INSTRUMENTATION] pricing checkout redirect check:', { checkoutPlan, hasSession: !!session });
    if (!checkoutPlan || !['starter', 'pro'].includes(checkoutPlan)) return;
    if (checkoutRestoredRef.current) return;

    if (!session) {
      console.log('[INSTRUMENTATION] redirecting unauthenticated user to signup for plan:', checkoutPlan);
      checkoutRestoredRef.current = true;
      saveSelectedPlan(checkoutPlan, '/pricing');
      window.location.href = `/signup?redirect=/pricing&plan=${checkoutPlan}`;
      return;
    }

    checkoutRestoredRef.current = true;
    onUpgradeClick(checkoutPlan);
  }, [onUpgradeClick, searchParams, session, sessionLoaded, plans]);

  const pricingFaq = [
    {
      q: 'Is there a free tier and how does it work?',
      a: 'Yes! Our Free tier allows you to generate individual quotes, invoices, and set up your public profile with zero credit card required. Watermarked PDF exports are free. You only upgrade to a paid tier when you need custom branding, automatic payment reminders, or unlimited client portal delivery.',
    },
    {
      q: 'Do you offer a money-back guarantee?',
      a: 'Absolutely. We offer a 14-day money-back guarantee. If you are not satisfied with Corvioz Starter, Pro, or Studio for any reason within the first 14 days of upgrading, email support@corvioz.com for a full, prompt refund. No questions asked.',
    },
    {
      q: 'Can I cancel or change plans later?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your account settings. There are no lock-in contracts or cancelation fees.',
    },
    {
      q: 'How do client portals work?',
      a: 'When you send a quote or invoice, your client gets a private, secure link. They can approve quotes, write comment feedback, and pay invoices via credit card or bank transfer without needing a Corvioz account. Everything syncs back to your dashboard in real-time.',
    },
    {
      q: 'Is Corvioz full accounting software?',
      a: 'No. Corvioz is a focused commercial workspace, not full bookkeeping or accounting software. We handle client-facing operations—winning the client with proposals, billing them with professional invoices, and tracking payment status—without accounting complexity.',
    },
  ];

  if (!(mounted && identity !== null)) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', paddingBottom: '80px' }}>
        <nav className="navbar pricing-navbar">
          <Logo />
          <div className="nav-links">
            <Button href="/dashboard" variant="secondary" size="sm">Sign in</Button>
            <span className="pricing-theme-toggle">
              <ThemeToggle />
            </span>
          </div>
        </nav>
        <main style={{ maxWidth: '980px', margin: '0 auto', padding: '120px clamp(16px, 5vw, 24px) 48px', textAlign: 'center' }}>
          <header style={{ marginBottom: '56px' }}>
            <p className="section-kicker" style={{ color: 'var(--primary)', fontWeight: 800 }}>Corvioz Identity Gate</p>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', lineHeight: 1.15, marginBottom: '20px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-1.5px' }}>
              Choose Your Professional Identity.
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
              Select your operating mode to view plan features and CTA packages tailored to your exact freelance workflow.
            </p>
          </header>
          <IdentityGate
            currentIdentity={identity}
            onSelect={(id) => {
              setIdentity(id);
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('corvioz_identity', id);
              }
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', paddingBottom: '80px' }}>
      <style>{`
        .toggle-btn {
          background: transparent;
          border: none;
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .toggle-btn.active {
          background: var(--primary);
          color: var(--white);
          box-shadow: var(--shadow-sm);
        }
        .pricing-card {
          background: var(--background-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          transition: all 0.3s ease;
        }
        .pricing-card.popular {
          border: 1.5px solid var(--primary);
          box-shadow: var(--shadow-md);
          transform: none;
        }
        @media (max-width: 980px) {
          .pricing-card.popular {
            transform: none;
            margin: 12px 0;
          }
        }
        .pricing-badge {
          position: absolute;
          top: -14px;
          right: 32px;
          background: var(--primary);
          color: var(--white);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .check-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          color: var(--text-soft);
        }
        .stat-box {
          text-align: center;
          padding: 24px;
          border-right: 1px solid var(--border);
        }
        .stat-box:last-child {
          border-right: none;
        }
        @media (max-width: 768px) {
          .stat-box {
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .stat-box:last-child {
            border-bottom: none;
          }
        }
        .testimonial-card {
          background: var(--background-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 28px;
        }
        @media (max-width: 640px) {
          .pricing-navbar {
            padding: 0 14px;
            gap: 12px;
          }
          .pricing-navbar .nav-links {
            gap: 8px;
            min-width: 0;
          }
          .pricing-navbar .nav-link {
            display: none;
          }
          .pricing-navbar .btn {
            padding-left: 10px;
            padding-right: 10px;
          }
          .pricing-card {
            padding: 28px 20px;
          }
          .pricing-badge {
            right: 20px;
          }
        }
        @media (max-width: 480px) {
          .pricing-navbar .nav-links .btn {
            font-size: 0.75rem;
          }
          .pricing-navbar .nav-links .btn:last-child {
            display: none;
          }
        }
        @media (max-width: 340px) {
          .pricing-theme-toggle {
            display: none;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="navbar pricing-navbar">
        <Logo />
        <div className="nav-links">
          {mounted && ui.identity && (
            <>
              <Link href="/#features" className="nav-link">Features</Link>
              <Link href="/#how-it-works" className="nav-link">How it works</Link>
              <Link href="/pricing" className="nav-link" style={{ fontWeight: 700 }}>Pricing</Link>
              <Link href="/#resources" className="nav-link">Resources</Link>
            </>
          )}
          <Button href="/dashboard" variant="secondary" size="sm" onClick={() => trackEvent('cta_click', { cta_name: 'Sign in', position: 'pricing_navbar' })}>Sign in</Button>
          {mounted && ui.identity && (
            <Button
              href="/dashboard?tool=invoice"
              variant="primary"
              size="sm"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=invoice', '/pricing');
                trackEvent('signup_click', { position: 'pricing_navbar' });
                trackEvent('cta_click', { cta_name: ui.cta('navbar'), position: 'pricing_navbar' });
              }}
            >
              {ui.cta('navbar')}
            </Button>
          )}
          <span className="pricing-theme-toggle">
            <ThemeToggle />
          </span>
        </div>
      </nav>

      {/* Header */}
      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '60px clamp(16px, 5vw, 24px) 0', overflowX: 'clip' }}>
        <header style={{ textAlign: 'center', marginBottom: '56px' }}>
          {mounted && ui.identity && (
            <div style={{ marginBottom: '24px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: ui.identity === 'starter' ? 'var(--primary)' : ui.identity === 'pro' ? 'var(--success)' : 'var(--accent)',
                background: 'var(--btn-secondary-bg)',
                border: `1px solid ${ui.identity === 'starter' ? 'var(--primary)' : ui.identity === 'pro' ? 'var(--success)' : 'var(--accent)'}`,
                padding: '6px 16px',
                borderRadius: '99px',
                cursor: 'pointer'
              }} onClick={() => {
                setIdentity(null);
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('corvioz_identity');
                }
              }}>
                Role: {ui.identity === 'starter' ? 'Starter' : ui.identity === 'pro' ? 'Pro' : 'Studio'} (Click to change)
              </span>
            </div>
          )}
          <p className="section-kicker" style={{ color: ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'pro' ? 'var(--success)' : 'var(--accent)', fontWeight: 800 }}>
            {mounted && ui.copy ? ui.copy.kicker : "PRICING"}
          </p>
          <h1 className="section-title" style={{ marginBottom: '12px', fontWeight: 900 }}>
            {mounted && ui.copy ? ui.copy.headline : "Pick your mode."}
          </h1>
          <p className="section-lede" style={{ marginBottom: '32px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto' }}>
            {mounted && ui.copy ? ui.copy.lede : "Most freelancers start on Free and upgrade to Pro within their first two weeks."}
          </p>

          {/* Engine-driven upgrade nudge banner */}
          {upgradeBanner && (
            <div style={{
              background: upgradeBanner.targetPlan === 'starter'
                ? 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 100%)'
                : upgradeBanner.targetPlan === 'pro'
                ? 'linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)'
                : 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(168,85,247,0.03) 100%)',
              border: upgradeBanner.targetPlan === 'starter'
                ? '1px solid rgba(99,102,241,0.3)'
                : upgradeBanner.targetPlan === 'pro'
                ? '1px solid rgba(34,197,94,0.3)'
                : '1px solid rgba(168,85,247,0.3)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '32px',
              maxWidth: '680px',
              marginLeft: 'auto',
              marginRight: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>
                {upgradeBanner.targetPlan === 'studio' ? '🚀' : upgradeBanner.targetPlan === 'pro' ? '📈' : '⚡'}
              </span>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 600, textAlign: 'left', lineHeight: 1.4 }}>
                {upgradeBanner.reason}
              </p>
            </div>
          )}


          {/* Identity Ladder */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0',
            background: 'var(--btn-secondary-bg)',
            border: '1px solid var(--border)',
            borderRadius: '99px',
            padding: '0',
            marginBottom: '36px',
            overflow: 'hidden',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}>
            <span style={{ padding: '8px 20px', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
              Free &nbsp;<span style={{ opacity: 0.6, fontWeight: 400 }}>→ Try</span>
            </span>
            <span style={{ padding: '8px 20px', color: 'var(--primary)', background: 'var(--primary-glow)', borderRight: '1px solid var(--border)' }}>
              Pro &nbsp;<span style={{ opacity: 0.8, fontWeight: 400 }}>→ Work</span>
            </span>
            <span style={{ padding: '8px 20px', color: 'var(--text-soft)' }}>
              Studio &nbsp;<span style={{ opacity: 0.6, fontWeight: 400 }}>→ Scale</span>
            </span>
          </div>

          {/* Billing Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📈 Switch to Yearly for 2 Months Free (Save 20%)
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--btn-secondary-bg)', padding: '4px', borderRadius: '99px', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
                style={billingPeriod === 'monthly' ? { 
                  background: ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'pro' ? 'var(--success)' : 'var(--accent)',
                  color: 'var(--white)',
                  boxShadow: 'var(--shadow-sm)'
                } : {}}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('yearly')}
                className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  ...(billingPeriod === 'yearly' ? {
                    background: ui.pricing_variant === 'starter' ? 'var(--primary)' : ui.pricing_variant === 'pro' ? 'var(--success)' : 'var(--accent)',
                    color: 'var(--white)',
                    boxShadow: 'var(--shadow-sm)'
                  } : {})
                }}
              >
                Yearly <span style={{ 
                  background: billingPeriod === 'yearly' ? 'rgba(255, 255, 255, 0.25)' : 'var(--success-glow)', 
                  color: billingPeriod === 'yearly' ? 'var(--white)' : 'var(--success)', 
                  fontSize: '0.65rem', 
                  padding: '1px 6px', 
                  borderRadius: '99px', 
                  fontWeight: 750,
                  transition: 'all 0.3s ease'
                }}>Save 20%</span>
              </button>
            </div>
          </div>

          {/* Trust copy badges (TASK 2) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px 24px',
            marginBottom: '32px',
            fontSize: '0.8rem',
            color: 'var(--text-soft)',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒</span> Secure payments via Stripe
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🛡️</span> Your data is encrypted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📅</span> Cancel anytime
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💸</span> No setup fees
            </div>
          </div>
        </header>

        {/* Pricing Cards Grid */}
        <style>{`
          .pricing-grid-v2 {
            display: grid;
            grid-template-columns: 0.9fr 1.1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 80px;
            align-items: stretch;
          }
          @media (max-width: 1100px) {
            .pricing-grid-v2 {
              grid-template-columns: 1fr 1fr;
            }
          }
          @media (max-width: 640px) {
            .pricing-grid-v2 {
              grid-template-columns: 1fr;
            }
          }
          .pricing-card-free {
            background: var(--background-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 28px 22px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            opacity: 0.85;
            box-shadow: var(--shadow-md);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pricing-card-free:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
            border-color: var(--text-muted);
          }
          .pricing-card-pro {
            background: var(--background-card);
            border: 2px solid var(--primary);
            border-radius: 18px;
            padding: 36px 28px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            box-shadow: var(--shadow-md), 0 12px 30px -10px var(--primary-glow), 0 0 0 4px var(--primary-glow);
            transform: scale(1.03);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pricing-card-pro:hover {
            transform: scale(1.05) translateY(-4px);
            box-shadow: var(--shadow-md), 0 20px 40px -12px var(--primary-glow), 0 0 0 6px var(--primary-glow);
          }
          .pricing-card-pro-tier {
            background: linear-gradient(145deg, var(--background-card) 0%, color-mix(in srgb, var(--success) 4%, var(--background-card)) 100%);
            border: 1.5px solid color-mix(in srgb, var(--success) 40%, var(--border));
            border-radius: 14px;
            padding: 28px 22px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: var(--shadow-md);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pricing-card-pro-tier:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
            border-color: var(--success);
          }
          .pricing-card-studio {
            background: linear-gradient(145deg, var(--background-card) 0%, color-mix(in srgb, var(--accent) 4%, var(--background-card)) 100%);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 28px 22px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: var(--shadow-md);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .pricing-card-studio:hover {
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
            border-color: var(--accent);
          }
          .studio-check-icon { stroke: var(--accent); }
        `}</style>

        {plansLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading plans...</p>
          </div>
        ) : (
          <div className="pricing-grid-v2">
            {uniqueViewModels.map((vm) => {
              const isFree = vm.id === 'free';
              const isStarter = vm.id === 'starter';
              const isPro = vm.id === 'pro';
              const isStudio = vm.id === 'studio';
              
              const cardClass = isStarter ? 'pricing-card-pro' : isPro ? 'pricing-card-pro-tier' : (isStudio ? 'pricing-card-studio' : 'pricing-card-free');
              const checkColor = isStarter ? 'var(--primary)' : isPro ? 'var(--success)' : (isStudio ? 'var(--accent)' : 'var(--success)');
              
              const price = billingPeriod === 'monthly' ? vm.priceMonthly : vm.priceYearly;
              const savingsText = isStarter ? 'Save 17%' : isPro ? 'Save 16%' : (isStudio ? 'Save 17%' : null);
              const billedAnnuallyText = vm.priceYearly > 0 ? `Billed annually ($${Math.round(vm.priceYearly * 12)}/year)` : null;
              
              const isCurrentPlan = vm.isCurrent;
              
              // Dynamic UI values from Injection Layer (v9.3)
              const uiInject = getUIInjection(vm.id);
              const badgeText = uiInject.badgeText;
              const ctaText = uiInject.ctaText;
              const helperText = uiInject.helperText;
 
              const isRecommended = vm.highlightedPlan === vm.id;
              const intensity = vm.visualIntensity;
 
              const cardStyle = isRecommended ? {
                borderColor: vm.id === 'starter' ? 'var(--primary)' : vm.id === 'pro' ? 'var(--success)' : 'var(--accent)',
                boxShadow: vm.id === 'starter'
                  ? `0 12px 30px -10px var(--primary-glow), 0 0 0 ${4 + intensity * 2}px var(--primary-glow)`
                  : vm.id === 'pro'
                  ? `0 12px 30px -10px rgba(34,197,94,${0.1 + intensity * 0.1}), 0 0 0 ${3 + intensity}px rgba(34,197,94,0.1)`
                  : `0 12px 30px -10px rgba(99,102,241,${0.1 + intensity * 0.1}), 0 0 0 ${3 + intensity}px rgba(99,102,241,0.1)`,
                transform: vm.id === 'starter' ? 'scale(1.04) translateY(-4px)' : 'translateY(-4px)',
                zIndex: 5,
              } : {};
 
              return (
                <div key={vm.id} className={cardClass} style={cardStyle} onMouseEnter={() => trackEvent('pricing_hover_plan', { plan: vm.id })}>
                  {isRecommended && !vm.isCurrent && (
                    <div style={{ position: 'absolute', top: '-14px', left: '20px', background: vm.id === 'starter' ? 'var(--primary)' : vm.id === 'pro' ? 'var(--success)' : 'var(--accent)', color: 'var(--white)', padding: '4px 14px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.05em', whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)', zIndex: 10 }}>
                      🔥 RECOMMENDED FOR YOU
                    </div>
                  )}
                  {vm.isCurrent && (
                    <div style={{ position: 'absolute', top: isStarter ? '14px' : '-14px', right: '16px', background: 'var(--success)', color: 'var(--white)', padding: '3px 12px', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      ✓ Current Plan
                    </div>
                  )}
                  <div>
                    {badgeText && (
                      <div style={{
                        display: 'inline-block',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: isStarter ? 'var(--primary)' : isPro ? 'var(--success)' : (isStudio ? 'var(--accent)' : 'var(--text-muted)'),
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '14px',
                        background: isStarter ? 'var(--primary-glow)' : isPro ? 'rgba(34,197,94,0.08)' : (isStudio ? 'rgba(99,102,241,0.07)' : 'var(--btn-secondary-bg)'),
                        border: `1px solid ${isStarter ? 'var(--primary)' : isPro ? 'rgba(34,197,94,0.3)' : (isStudio ? 'rgba(99,102,241,0.2)' : 'var(--border)')}`,
                        borderRadius: '99px',
                        padding: '3px 10px'
                      }}>
                        {badgeText}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <h2 style={{ fontSize: isStarter ? '1.6rem' : '1.3rem', fontWeight: isStarter ? 900 : 800, color: 'var(--text-main)', margin: 0, letterSpacing: isStarter ? '-0.02em' : 'normal' }}>
                        {vm.name}
                      </h2>
                      {vm.identity && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em', 
                          color: checkColor, 
                          background: isStarter ? 'var(--primary-glow)' : 'var(--btn-secondary-bg)', 
                          border: `1px solid ${checkColor}`,
                          padding: '3px 10px', 
                          borderRadius: '12px' 
                        }}>
                          {vm.identity}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16px' }}>
                      {vm.id === 'studio' ? (
                        <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>
                          Coming Soon
                        </span>
                      ) : (
                        <>
                          <span style={{ fontSize: isStarter ? '2.2rem' : '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
                            ${price}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            /{billingPeriod === 'monthly' ? 'mo' : 'mo'}
                          </span>
                        </>
                      )}
                      <span style={{ marginLeft: '8px' }}>
                        {billingPeriod === 'yearly' && savingsText && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isPro ? 'var(--success)' : isStudio ? 'var(--accent)' : 'var(--primary)', background: isPro ? 'rgba(34,197,94,0.08)' : isStudio ? 'rgba(99,102,241,0.08)' : 'var(--primary-glow)', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${isPro ? 'rgba(34,197,94,0.2)' : isStudio ? 'rgba(99,102,241,0.2)' : 'var(--primary)'}` }}>
                            {savingsText}
                          </span>
                        )}
                      </span>
                    </div>
                    {billingPeriod === 'yearly' && billedAnnuallyText && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 550 }}>
                        {billedAnnuallyText}
                      </div>
                    )}
                    <p style={{ fontSize: '0.92rem', fontWeight: 550, color: 'var(--text-muted)', marginBottom: '16px', minHeight: '44px', lineHeight: 1.45 }}>
                      {vm.outcome}
                    </p>
                    {vm.features && vm.features.length > 0 && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        {vm.features.map((feature, fIdx) => (
                          <li key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: 600, lineHeight: '1.4' }}>
                            <span style={{ color: checkColor, fontWeight: 'bold' }}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <Button
                      onClick={() => {
                        if (isCurrentPlan) return;
                        if (isFree) {
                          window.location.href = '/dashboard?action=create-profile';
                          return;
                        }
                        if (vm.id === 'studio') {
                          alert("Thank you! You have been added to the Studio waitlist.");
                          return;
                        }
                        if (!['starter', 'pro'].includes(vm.id)) return;
                        const intentLevel = getIntentLevel();
                        trackPricingClick({ position: 'pricing_page_card', plan: vm.id });
                        trackIntentAction('CLICK_CTA');
                        trackFunnelEvent('cta_click', { plan: vm.id });
                        router.push(`/checkout?plan=${vm.id}&intent=${intentLevel.toLowerCase()}`);
                      }}
                      disabled={checkoutLoading || isCurrentPlan}
                      variant={isPro ? 'primary' : 'secondary'}
                      style={{ width: '100%', fontWeight: isPro ? 800 : 'normal', padding: isPro ? '14px' : '10px', fontSize: isPro ? '0.93rem' : '0.83rem', borderColor: isStudio ? 'rgba(99,102,241,0.3)' : isStarter ? 'rgba(34,197,94,0.3)' : undefined, opacity: isCurrentPlan ? 0.7 : 1 }}
                    >
                      {checkoutLoading ? 'Preparing Checkout...' : vm.ctaLabel}
                    </Button>

                    {/* Trust Microcopy */}
                    {vm.id === 'starter' && (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                        {mounted && ui.copy?.cardTrustMicrocopy}
                      </p>
                    )}
                    {vm.id === 'pro' && (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                        {mounted && ui.copy?.cardTrustMicrocopy}
                      </p>
                    )}
                    {vm.id === 'studio' && (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '10px', marginBottom: 0, fontWeight: 600 }}>
                        {mounted && ui.copy?.cardTrustMicrocopy}
                      </p>
                    )}

                    {/* Policy Agreement Inline Link */}
                    {!isFree && (
                      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        By continuing, you agree to our <Link href="/terms" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Terms</Link> & <Link href="/privacy" style={{ textDecoration: 'underline', color: 'var(--text-muted)' }}>Privacy Policy</Link>
                      </div>
                    )}

                    {helperText && (
                      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0, fontWeight: 550 }}>
                        {helperText}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Why Corvioz is Safe Trust Module (TASK 2) */}
        {mounted && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '56px',
            width: '100%',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
              Why Corvioz is safe:
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-soft)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> Built for freelancers in US & Canada
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> No hidden billing logic
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> You control your data
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span> Payments handled securely via Stripe
              </li>
            </ul>
          </div>
        )}

        {/* Trust Signals: Metrics Section */}
        <section className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '80px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
            <div className="stat-box">
              <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px 0' }}>14 days</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Refund Guarantee</p>
            </div>
            <div className="stat-box">
              <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px 0' }}>No card</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Required to start</p>
            </div>
            <div className="stat-box">
              <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px 0' }}>Cancel</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Anytime, no lock-in</p>
            </div>
            <div className="stat-box">
              <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', margin: '0 0 4px 0' }}>Free PDF</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Watermark preview on free plan</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 850, marginBottom: '40px' }}>
            What freelancers say
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
            <div className="testimonial-card">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, margin: '0 0 16px 0', fontStyle: 'italic' }}>
                &ldquo;Corvioz completely changed how I send estimates and invoices. Clients approve quotes instantly, and the integrated portal makes my studio look polished.&rdquo;
              </p>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)' }}>Sarah L.</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Independent UI/UX Designer</span>
            </div>
            <div className="testimonial-card">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', lineHeight: 1.6, margin: '0 0 16px 0', fontStyle: 'italic' }}>
                &ldquo;Moving from spreadsheets to Corvioz cut my billing admin time in half. It is simple, direct, and does exactly what freelancers actually need.&rdquo;
              </p>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-main)' }}>David K.</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full-Stack Developer</span>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        {mounted && ui.copy?.trustBadges && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '32px', margin: '0 auto 40px', maxWidth: '800px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
            {ui.copy.trustBadges.map((badge, idx) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                🔒 {badge}
              </span>
            ))}
          </div>
        )}

        {/* Risk Reversal & Safe Checkout Guarantee */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 56px auto',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '16px',
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          textAlign: 'left',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>🛡️ 14-Day Money-Back Guarantee</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Try Corvioz paid tiers risk-free. If it doesn't help you get paid faster or manage clients more efficiently, email support@corvioz.com within 14 days for a full refund. No questions asked.
            </p>
          </div>
          <div className="checkout-trust-separator" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>🔒 Safe & Secure Checkout</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              We partner with Stripe to handle payment processing. Your credit card information is encrypted at rest and never touches our servers. Cancel or downgrade back to the Free plan in 1-click anytime.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <section style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 850, marginBottom: '32px' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pricingFaq.map((item, idx) => (
              <div key={item.q} className="faq-item" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                   type="button"
                   onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                   style={{
                     width: '100%',
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '16px 20px',
                     background: 'var(--btn-secondary-bg)',
                     border: 'none',
                     textAlign: 'left',
                     color: 'var(--text-main)',
                     fontWeight: 650,
                     cursor: 'pointer',
                     fontSize: '0.9rem'
                   }}
                >
                  <span>{item.q}</span>
                  <span>{activeFaq === idx ? '-' : '+'}</span>
                </button>
                {activeFaq === idx && (
                  <p style={{ margin: 0, padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--background-card)' }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', marginTop: '80px', padding: '44px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
          <Link href="/refund-policy" style={{ color: 'var(--text-muted)' }}>Refund Policy</Link>
          <Link href="/security" style={{ color: 'var(--text-muted)' }}>Security & Data</Link>
          <Link href="/contact" style={{ color: 'var(--text-muted)' }}>Contact</Link>
        </div>
        
        <p style={{ margin: '16px 0 12px 0', fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 600 }}>
          {mounted && ui.copy?.cardTrustMicrocopy}
        </p>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '24px',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          fontWeight: 550,
          marginBottom: '20px'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🔒 {
            mounted && ui.copy?.trustBadges?.[0]
          }</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🇪🇺 GDPR Ready</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>💳 Secure Payments</span>
        </div>

        <p>© {new Date().getFullYear()} Corvioz. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingContent />
    </Suspense>
  );
}
