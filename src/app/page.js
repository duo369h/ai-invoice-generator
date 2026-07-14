'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from './components/UIComponents';
import PublicHeader from './components/PublicHeader';
import SharedFooter from './components/SharedFooter';
import { saveIntendedRoute, saveSelectedPlan } from './lib/intent-store';
import { calculatePlanPrice } from '../core/pricing/pricingDeterministicMapper';
import { sendEvent } from '../core/analytics/eventRouter';
import { trackEvent } from './lib/analytics';

const REVIEW_SAFE_PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'For testing the core quote, document, and profile workflow.',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Draft quotes and client documents',
      'Basic profile setup',
      'Watermarked PDF preview',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For independent professionals who need a simple, repeatable client delivery dashboard.',
    price_monthly: 9,
    price_yearly: 7,
    features: [
      'Client-ready quotes',
      'Invoice and quote workflow',
      'Basic client delivery controls',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For working professionals managing multiple client projects.',
    price_monthly: 19,
    price_yearly: 16,
    features: [
      'Unlimited quotes and Public Profiles',
      'Clean PDF export without watermark',
      'Client links and stronger delivery controls',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For small studios that need broader client management.',
    price_monthly: 29,
    price_yearly: 24,
    features: [
      'Studio client areas',
      'Reusable brand and delivery controls',
      'Priority workflow support',
    ],
  },
];

function normalizePlansForReview(rawPlans) {
  const uniquePlansMap = new Map();
  if (Array.isArray(rawPlans)) {
    rawPlans.forEach((plan) => {
      if (plan?.id && !uniquePlansMap.has(plan.id)) {
        uniquePlansMap.set(plan.id, plan);
      }
    });
  }

  return REVIEW_SAFE_PRICING_PLANS.map((fallbackPlan) => {
    const apiPlan = uniquePlansMap.get(fallbackPlan.id);
    const apiMonthly = Number(apiPlan?.price_monthly ?? fallbackPlan.price_monthly);
    const apiYearly = Number(apiPlan?.price_yearly ?? fallbackPlan.price_yearly);
    const useFallbackStudioPrice = fallbackPlan.id === 'studio' && (apiMonthly <= 0 || apiYearly <= 0);

    return {
      ...fallbackPlan,
      ...(apiPlan || {}),
      features: Array.isArray(apiPlan?.features)
        && apiPlan.features.length > 0
        ? apiPlan.features
        : fallbackPlan.features,
      price_monthly: useFallbackStudioPrice ? fallbackPlan.price_monthly : apiMonthly,
      price_yearly: useFallbackStudioPrice ? fallbackPlan.price_yearly : apiYearly,
    };
  });
}

const resources = [
  { title: 'Freelance Pricing Guide', href: '/blog/how-to-price-web-design-projects' },
  { title: 'Client Follow-Up Guide', href: '/blog/best-invoice-software-for-freelancers' },
  { title: 'Invoice vs Quote vs Receipt', href: '/blog/invoice-vs-quote-vs-receipt' },
];

const faqs = [
  {
    q: 'Why Corvioz instead of invoicing software?',
    a: 'Corvioz starts before the final document. It helps freelancers create a quote, prepare an invoice, and keep client records organized in one dashboard.',
  },
  {
    q: 'Who is Corvioz built for?',
    a: 'Corvioz is built for photographers, consultants, designers, developers, and small studios that need a clear quote-to-invoice workflow without a heavy accounting suite.',
  },
  {
    q: 'Can I manage recurring clients?',
    a: 'Yes. You can keep client records, reuse quote and invoice details, and manage repeat work from the same dashboard.',
  },
  {
    q: 'How are subscription plans handled?',
    a: 'Subscriptions are securely handled through Paddle. Corvioz does not store card details.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can move between Free, Starter, and Pro as your client workflow changes, without changing your existing quotes, invoices, or client records.',
  },
  {
    q: 'Can I cancel before renewal?',
    a: 'Yes. You can cancel future renewal before the next plan period or request plan support without cancellation fees or long-term contracts.',
  },
  {
    q: 'How do refunds work?',
    a: 'Subscription plans include a clear 14-day refund window. Email support@corvioz.com with your account email and Paddle receipt.',
  },
  {
    q: 'Who owns my data?',
    a: 'You own your invoices, quotes, client records, and exported documents. Corvioz does not sell personal data.',
  },
  {
    q: 'Can I export my invoices?',
    a: 'Yes. You can export client-ready invoices and quote documents so your records are not locked inside Corvioz.',
  },
  {
    q: 'How long is my data stored?',
    a: 'Account data is retained while your account is active and handled according to the privacy policy. Deleted account data follows the stated retention and deletion process.',
  },
  {
    q: 'How is my data protected?',
    a: 'Corvioz uses Supabase for authentication and database storage, and subscriptions are securely handled through Paddle with scoped account-data access patterns.',
  },
  {
    q: 'Do clients need an account?',
    a: 'No. Clients can review shared quote, invoice, and Client Portal links without creating a Corvioz account.',
  },
  {
    q: 'Can I customize invoices?',
    a: 'Yes. Corvioz supports professional invoice document details and subscription plans add stronger branding and delivery controls.',
  },
  {
    q: 'Can I use my own branding?',
    a: 'Yes. Branding options depend on your plan, with subscription plans designed for independent professionals who want more polished client delivery.',
  },
  {
    q: 'Is Corvioz full accounting software?',
    a: 'No. Corvioz is a client management dashboard for quotes, invoices, and client records. It does not replace bookkeeping or tax software.',
  },
];

const launchWorkflowSteps = [
  { title: 'Capture Request', icon: '01' },
  { title: 'Create Quote', icon: '02' },
  { title: 'Prepare Quote', icon: '03' },
  { title: 'Manage Delivery', icon: '04' },
];

function ProductPreview() {
  const steps = [
    { icon: '01', label: 'Request', text: 'Project scope captured', badge: 'Logged' },
    { icon: '02', label: 'Quote', text: 'Milestone estimate prepared', badge: 'Drafted' },
    { icon: '03', label: 'Quote', text: 'Client document delivered', badge: 'Sent' },
    { icon: '04', label: 'Approval', text: 'Client approval captured', badge: 'Approved' },
    { icon: '05', label: 'Delivery', text: 'Client timeline updated', badge: 'Completed', isOutcome: true }
  ];

  return (
    <div className="hero-product-card" aria-label="Corvioz product preview">
      <div className="product-topbar">
        <div className="window-dots"><span /><span /><span /></div>
        <span>dashboard / client management</span>
        <span>Live workflow preview</span>
      </div>
      <div className="product-preview-header">
        <div>
          <span className="preview-label">Client delivery flow</span>
          <h3>Quote to client approval, in one dashboard.</h3>
        </div>
        <div className="preview-summary-pill">5 steps organized</div>
      </div>
      <div className="workflow-container">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className={`workflow-step ${step.isOutcome ? 'outcome-step' : ''}`}>
              <span className="workflow-step-icon">{step.icon}</span>
              <h4>{step.label}</h4>
              <p>{step.text}</p>
              <span className={`workflow-step-badge${step.isOutcome ? ' outcome' : ''}`}>
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
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    // Real Behavior Capture Layer
    sendEvent('LANDING_VIEW', { source: 'homepage' });
  }, []);

  // RBC: Scroll depth tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let fired50 = false;
    let fired90 = false;
    const handler = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const pct = total > 0 ? scrolled / total : 0;
      if (!fired50 && pct >= 0.5) { fired50 = true; sendEvent('SCROLL_DEPTH_50', { path: '/' }); }
      if (!fired90 && pct >= 0.9) { fired90 = true; sendEvent('SCROLL_DEPTH_90', { path: '/' }); }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.plans) {
            setPlans(normalizePlansForReview(data.plans));
            return;
          }
        }
        if (active) setPlans(REVIEW_SAFE_PRICING_PLANS);
      } catch (err) {
        console.error('Failed to fetch pricing plans on homepage:', err);
        if (active) setPlans(REVIEW_SAFE_PRICING_PLANS);
      } finally {
        if (active) setPlansLoading(false);
      }
    };
    fetchPlans();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="landing-page">
      <PublicHeader
          className="navbar landing-nav"
          surfaceId="home-global-control-surface"
          route="/"
          navLinks={[
            { label: 'How It Works', href: '#how-corvioz-works' },
            { label: 'For Photographers', href: '/for-photographers' },
            { label: 'Pricing', href: '#pricing' },
            {
              label: 'Resources',
              href: '#resources',
              children: [
                { label: 'Blog', href: '/blog' },
                { label: 'Invoice Templates', href: '/invoice-template' },
                { label: 'Quote Templates', href: '/quote-template' },
              ],
            },
            { label: 'Security', href: '/security' },
            { label: 'Help Center', href: '/help' },
          ]}
          accountAction={{
            label: 'Sign in',
            href: '/dashboard',
            variant: 'secondary',
            onClick: () => trackEvent('cta_click', { cta_name: 'Sign in', position: 'navbar' }),
          }}
          primaryAction={{
            label: 'Create Quote',
            href: '/dashboard?tool=quote',
            variant: 'primary',
            onClick: () => {
              saveIntendedRoute('/dashboard?tool=quote', '/');
              trackEvent('signup_click', { position: 'navbar' });
              trackEvent('cta_click', { cta_name: 'Create Quote', position: 'navbar' });
            },
          }}
      />

      <header className="landing-hero animate-fade-in">
        <div className="hero-content-center">
          <div className="hero-badge">
            Photography Business Dashboard
          </div>
          <h1 className="hero-title">
            Run every client workflow<br />
            <span className="glow-gradient-text">with structure.</span>
          </h1>
          <p className="hero-lede">
            Corvioz helps independent professionals organize quotes, invoices, client documents, and project records in one focused dashboard.
          </p>

          <div className="hero-actions">
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              className="btn-hero-primary"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                sendEvent('CTA_CLICK', { cta_name: 'Create Quote', position: 'hero', label: 'Create Quote' });
              }}
            >
              Create Quote
            </Button>
            <Button
              href="/demo"
              variant="secondary"
              size="lg"
              className="btn-hero-secondary"
              onClick={() => { sendEvent('CTA_CLICK', { cta_name: 'Explore Example', position: 'hero', label: 'Explore Example' }); }}
            >
              View Example
            </Button>
          </div>
          <div className="hero-social-proof">
            <span>Free to start</span>
            <span>Built for independent professionals</span>
            <span>Subscriptions are securely handled through Paddle.</span>
          </div>
        </div>
      </header>

      <section className="section-product-preview">
        <ProductPreview />
      </section>

      <section id="how-corvioz-works" className="section section-how-it-works">
        <div className="landing-section-container landing-section-container--narrow u-text-center">
            <p className="section-kicker">How Corvioz Works</p>
            <p className="section-lede">One dashboard for turning client requests into organized documents, approvals, and delivery records.</p>
          <div className="workflow-steps-grid">
            {launchWorkflowSteps.map((step) => (
              <div key={step.title} className="workflow-step-card">
                <span className="workflow-step-number">
                  {step.icon}
                </span>
                <h3 className="workflow-step-title">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="why-corvioz" className="section section-why">
        <div className="landing-section-container landing-section-container--narrow u-text-center">
          <div className="section-header">
            <p className="section-kicker">Why Corvioz</p>
            <h2 className="section-title">Built for Independent Professionals</h2>
            <p className="section-lede">The simple, professional dashboard to handle quotes, invoices, client records, and portfolio delivery without subscription creep.</p>
          </div>

          <div className="why-cards-grid">
            <div className="card why-card">
              <h3 className="card-heading">Work more professionally</h3>
              <p className="card-body">
                Create consistent quotes, invoices, and client documents without rebuilding the same workflow every time.
              </p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Keep client work clear</h3>
              <p className="card-body">
                Track client records, document status, and project context from one organized dashboard.
              </p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Own your client records</h3>
              <p className="card-body">
                Your quotes, invoices, client notes, and exported documents remain part of your working archive.
              </p>
            </div>
          </div>

          <div className="trust-badges-row">
            <span>Subscriptions are securely handled through Paddle.</span>
            <span className="trust-divider">|</span>
            <span>Privacy-focused client data controls</span>
            <span className="trust-divider">|</span>
            <span>Free to try</span>
          </div>
          <p style={{ marginTop: '18px' }}>
            <Link href="/trust" className="btn btn-secondary btn-sm">
              Why Trust Corvioz
            </Link>
          </p>
        </div>
      </section>

      <section id="trust" className="section section-trust">
        <div className="landing-section-container landing-section-container--wide">
          <div className="section-header u-text-center">
            <p className="section-kicker">Platform Integrity &amp; Previews</p>
            <h2 className="section-title">Verified Visual Previews</h2>
            <p className="section-lede">Explore the visual structure and interface layouts of the Corvioz dashboard. No fake testimonials, no mock logos, just real product outlines.</p>
          </div>

          <div className="trust-stats-grid">
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--primary">Photographer Focus</span>
              <h3 className="trust-stat-heading">Built for independent professionals</h3>
              <p className="trust-stat-body">
                A focused, lightweight dashboard built specifically for independent professionals, sole proprietors, and consultants.
              </p>
            </Card>
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--success">Global Trust</span>
              <h3 className="trust-stat-heading">Used worldwide</h3>
              <p className="trust-stat-body">
                Independent professionals use Corvioz to draft milestone quotes, prepare client-ready documents, and keep project records organized.
              </p>
            </Card>
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--accent">Active Development</span>
              <h3 className="trust-stat-heading">Early Access</h3>
              <p className="trust-stat-body">
                We grow with real feedback. We prioritize simple, direct client workflows over complex systems and algorithms.
              </p>
            </Card>
          </div>

          <div className="screenshot-gallery-grid">
            <div className="product-preview-card">
              <div>
                <span className="preview-label">Layout 01</span>
                <h4 className="preview-heading">Photography Dashboard</h4>
                <p className="preview-body">
                  A focused dashboard for project status, active clients, open documents, and delivery outcomes.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row space-between">
                    <span className="wireframe-bar md w-30"></span>
                    <span className="wireframe-bar md w-20"></span>
                  </div>
                  <div className="wireframe-placeholder">
                    Dashboard overview
                  </div>
                  <div className="wireframe-grid-3">
                    <div className="wireframe-bar xl"></div>
                    <div className="wireframe-bar xl"></div>
                    <div className="wireframe-bar xl"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-preview-card">
              <div>
                <span className="preview-label">Layout 02</span>
                <h4 className="preview-heading">Milestone Quotes</h4>
                <p className="preview-body">
                  Turn project scope, milestone pricing, and client approval into a clear quote flow.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row">
                    <span className="wireframe-bar md w-60"></span>
                  </div>
                  <div className="wireframe-placeholder">
                    Quote builder
                  </div>
                  <div className="wireframe-row--interactive">
                    <span className="wireframe-bar sm w-40"></span>
                    <span className="wireframe-bar--cta"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-preview-card">
              <div>
                <span className="preview-label">Layout 03</span>
                <h4 className="preview-heading">Documents &amp; Client Updates</h4>
                <p className="preview-body">
                  Create branded client documents, track review status, and keep project records in one place.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row space-between">
                    <span className="wireframe-bar md w-40"></span>
                    <span className="wireframe-bar paid">DONE</span>
                  </div>
                  <div className="wireframe-placeholder">
                    Document timeline
                  </div>
                  <div className="wireframe-divider">
                    <span className="wireframe-bar sm w-20"></span>
                    <span className="wireframe-bar sm w-30 accent"></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="product-preview-card">
              <div>
                <span className="preview-label">Layout 04</span>
                <h4 className="preview-heading">Client Portal</h4>
                <p className="preview-body">
                  Give clients a direct place to review quotes, documents, approvals, and project updates.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row--align-center">
                    <span className="wireframe-avatar--sm"></span>
                    <span className="wireframe-bar sm w-50"></span>
                  </div>
                  <div className="wireframe-placeholder">
                    Client portal
                  </div>
                  <div className="wireframe-row">
                    <span className="wireframe-bar sm flex-1"></span>
                    <span className="wireframe-bar sm flex-1"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section section-pricing">
        <div className="landing-section-container landing-section-container--wide u-text-center">
          <p className="section-kicker">Pricing</p>
          <h2 className="section-title">Choose how you want to work.</h2>
          <p className="section-lede">Start with a focused client workflow, then upgrade when your documents, clients, and delivery process need more structure.</p>

          <div className="billing-period-wrapper">
            <div className="billing-savings-label">
              Switch to Yearly for 2 Months Free (Save 20%)
            </div>
            <div className="billing-toggle">
              <button
                type="button"
                className={`billing-toggle-btn${billingPeriod === 'monthly' ? ' active' : ''}`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`billing-toggle-btn${billingPeriod === 'yearly' ? ' active' : ''}`}
                onClick={() => setBillingPeriod('yearly')}
              >
                Yearly <span className="billing-save-badge">Save 20%</span>
              </button>
            </div>
          </div>

          {plansLoading ? (
            <div className="plans-loading">
              <p>Loading plans...</p>
            </div>
          ) : (
            <div className="pricing-grid pricing-grid-three">

              {plans.map((plan) => {
                const isStudio = plan.id === 'studio';
                const isPro = plan.id === 'pro';
                const isStudioUnavailable = isStudio;

                const { price, billedAnnuallyText } = calculatePlanPrice(plan, billingPeriod);

                const displayName = plan.name;
                const displayDescription = plan.description;
                const displayFeatures = plan.features || [];

                const ctaText = isStudioUnavailable ? 'Coming Soon' : (plan.id === 'free' ? 'Start Free' : `Choose ${plan.name}`);
                const hrefVal = isStudioUnavailable ? undefined : (plan.id === 'free' ? '/dashboard?action=create-profile' : `/pricing?checkout=${plan.id}`);
                const cardClassName = `pricing-card ${plan.id}${isPro ? ' featured' : ''}`;

                return (
                  <div key={plan.id} className={cardClassName}>
                    {isPro && (
                      <div className="pricing-badge-pill">
                        Most professionals choose this
                      </div>
                    )}
                    <div>
                      <h3>{displayName}</h3>
                      {isStudioUnavailable ? (
                        <div className="price-line u-mb-6">
                          <strong>Coming Soon</strong>
                        </div>
                      ) : (
                        <div className={`price-line${(billingPeriod === 'yearly' && billedAnnuallyText) ? ' u-mb-2' : ' u-mb-6'}`}>
                          <strong>{`$${price}`}</strong>
                          <span>/month</span>
                        </div>
                      )}
                      {!isStudioUnavailable && billingPeriod === 'yearly' && billedAnnuallyText && (
                        <div className="plan-billed-note">
                          {billedAnnuallyText}
                        </div>
                      )}
                      <p className={`plan-description${isPro ? ' featured' : ''}`}>
                        {displayDescription}
                      </p>
                      <ul className="plan-features">
                        {displayFeatures.map((feature) => (
                          <li key={feature} className="plan-feature-item">
                            <CheckIcon /> <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <Button
                        href={hrefVal}
                        variant={isPro ? 'primary' : 'secondary'}
                        className={`btn-plan-cta${isPro ? ' btn-plan-cta--featured' : ''}`}
                        onClick={() => {
                          if (isStudioUnavailable) return;
                          const planKey = plan.id;
                          saveSelectedPlan(planKey, '/');
                          sendEvent('PLAN_SELECTED', { position: 'pricing_card', plan: planKey, planId: planKey });
                        }}
                        disabled={isStudioUnavailable}
                      >
                        {ctaText}
                      </Button>

                      {!isStudioUnavailable && (
                        <div className="plan-cta-note">
                          By continuing, you agree to our <Link href="/terms">Terms</Link> &amp; <Link href="/privacy">Privacy Policy</Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section id="resources" className="section section-resources">
        <div className="landing-section-container landing-section-container--narrow u-text-center">
          <p className="section-kicker">Resources</p>
          <h2 className="section-title">Practical Guides for Client Work</h2>
          <div className="feature-overview-grid">
            {resources.map((resource) => (
              <Link key={resource.href} href={resource.href} className="resource-card">
                {resource.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section section-faq">
        <div className="landing-section-container landing-section-container--faq u-text-center">
          <p className="section-kicker">FAQ</p>
          <h2 className="section-title">Questions before you start</h2>
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
        </div>
      </section>

      <section id="transparency" className="section section-transparency">
        <div className="landing-section-container landing-section-container--narrow">
          <div className="transparency-grid">
            <div className="card transparency-card">
              <span className="transparency-label transparency-label--primary">Note from the Founder</span>
              <h3 className="transparency-heading">Built for Independent Professionals</h3>
              <p className="transparency-body">
                &quot;Hi, I&apos;m Duo, the creator of Corvioz. Like many of you, I struggled with bloated, expensive CRM software and accounting tools that assumed I had a finance team.
              </p>
              <p className="transparency-body">
                We built Corvioz to give independent professionals a focused, fast, and beautiful dashboard to handle quotes, invoices, client documents, and client records. We believe in providing value first, which is why you can try the tool with zero signup and download watermarked copies for free.&quot;
              </p>
              <strong className="transparency-sig">Duo, Founder of Corvioz</strong>
            </div>

            <div className="card transparency-card">
              <span className="transparency-label transparency-label--accent">Ethical &amp; Transparent</span>
              <h3 className="transparency-heading">Our Transparency Pledge</h3>
              <p className="transparency-body">
                We respect your data and trust. Guest mode drafts are secured locally in your own browser cache using localStorage. We do not track or store your client information on our servers until you choose to sign up and sync it.
              </p>
              <p className="transparency-body u-mb-0">
                Our monetization is simple: client-ready document export, custom client portals, and client record management are Pro features. We never sell your data, and we do not use manipulative pricing or fake urgency timers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="final-cta" className="section section-final-cta">
        <div className="landing-section-container landing-section-container--cta u-text-center">
          <p className="section-kicker">
            Built for independent professionals
          </p>
          <h2 className="section-title">
            Ready to create your first client quote?
          </h2>
          <p className="section-lede">
            Start with a quote, prepare a client document, and keep the client workflow clear from day one.
          </p>
          <div className="hero-actions center">
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                trackEvent('quote_create_click', { position: 'final_cta' });
                trackEvent('cta_click', {
                  cta_name: 'Create Quote',
                  position: 'final_cta'
                });
              }}
            >
              Create Quote
            </Button>
          </div>
          <p className="final-cta-note">
            Free during early access.
          </p>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
