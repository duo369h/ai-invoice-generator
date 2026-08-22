'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './components/UIComponents';
import PublicHeader from './components/PublicHeader';
import SharedFooter from './components/SharedFooter';
import HeroProductDemo from './components/HeroProductDemo';
import WorkflowContinuitySection from './components/WorkflowContinuitySection';
import ScopeClaritySection from './components/ScopeClaritySection';
import { saveIntendedRoute, saveSelectedPlan } from './lib/intent-store';
import { calculatePlanPrice } from '../core/pricing/pricingDeterministicMapper';
import { sendEvent } from '../core/analytics/eventRouter';
import { trackEvent } from './lib/analytics';

const REVIEW_SAFE_PRICING_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'For getting started with quotes and invoices.',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '5 combined new Quotes + Invoices per billing cycle',
      'Branded PDF',
      'No Client Portal, Client Approval, or Proposal',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For independent professionals who need a clean, repeatable workflow.',
    price_monthly: 9,
    price_yearly: 7,
    features: [
      '30 combined new Quotes + Invoices per billing cycle',
      'Clean PDF',
      'No Client Portal, Client Approval, or Proposal',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For working professionals managing client projects end to end.',
    price_monthly: 19,
    price_yearly: 16,
    features: [
      'Unlimited combined new Quotes + Invoices',
      'Clean PDF',
      'Client Portal with Quote Approval',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For studios that need a broader workflow in the future.',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
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
    return {
      ...fallbackPlan,
      ...(apiPlan || {}),
      features: Array.isArray(apiPlan?.features)
        && apiPlan.features.length > 0
        ? apiPlan.features
        : fallbackPlan.features,
      price_monthly: apiMonthly,
      price_yearly: apiYearly,
    };
  });
}

const resources = [
  {
    title: 'Freelance Pricing Guide',
    description: 'Build clearer project pricing without hiding the scope behind a single number.',
    href: '/blog/how-to-price-web-design-projects',
  },
  {
    title: 'Client Follow-Up Guide',
    description: 'Keep decisions and next steps moving without turning every reminder into a chase.',
    href: '/blog/best-invoice-software-for-freelancers',
  },
  {
    title: 'Invoice vs Quote vs Receipt',
    description: 'Understand where each document belongs in a professional client workflow.',
    href: '/blog/invoice-vs-quote-vs-receipt',
  },
];

const faqs = [
  {
    q: 'Who is Corvioz built for?',
    a: 'Corvioz is built for photographers, consultants, designers, developers, and small studios that need a clear client workflow without a heavy accounting suite.',
  },
  {
    q: 'Why Corvioz instead of invoicing software?',
    a: 'Corvioz starts before the invoice. It connects the quote, the client decision, the invoice, and the project record so the context does not disappear between tools.',
  },
  {
    q: 'Do clients need an account?',
    a: 'No. Clients can review shared quote, invoice, and Client Portal links without creating a Corvioz account.',
  },
  {
    q: 'Can I customize quotes and invoices?',
    a: 'Yes. Corvioz supports professional document details, with stronger branding and delivery controls available on subscription plans.',
  },
  {
    q: 'Who owns my data?',
    a: 'You own your quotes, invoices, client records, and exported documents. Corvioz does not sell personal data.',
  },
  {
    q: 'How are subscription plans handled?',
    a: 'Subscriptions are securely handled through Paddle. Corvioz does not store card details.',
  },
  {
    q: 'Can I cancel before renewal?',
    a: 'Yes. You can cancel future renewal before the next plan period without a long-term contract.',
  },
  {
    q: 'Is Corvioz accounting software?',
    a: 'No. Corvioz manages the client-facing workflow around quotes, invoices, and project records. It does not replace bookkeeping or tax software.',
  },
];

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
    <main className="landing-page public-reconciliation-v2">
      <PublicHeader
        className="navbar landing-nav landing-nav--editorial"
        surfaceId="home-global-control-surface"
        route="/"
        showThemeToggle={false}
        navLinks={[
          { label: 'How It Works', href: '#how-corvioz-works' },
          { label: 'For Photographers', href: '/for-photographers' },
          { label: 'Why Corvioz', href: '#why-corvioz' },
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
        ]}
        accountAction={{
          label: 'Sign in',
          href: '/dashboard',
          variant: 'secondary',
          onClick: () => trackEvent('cta_click', { cta_name: 'Sign in', position: 'navbar' }),
        }}
      />

      <header className="landing-hero landing-hero--editorial animate-fade-in">
        <div className="hero-content-center">
          <div className="hero-badge">Client workflow, connected</div>
          <h1 className="hero-title">
            Run every client workflow<br />
            <span>with structure.</span>
          </h1>
          <p className="hero-lede">
            Create the quote, capture the client&apos;s decision, issue the invoice, and keep every step connected through payment.
          </p>

          <div className="hero-actions">
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              className="btn-hero-primary btn-hero-primary--ink"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                sendEvent('CTA_CLICK', { cta_name: 'Create Quote', position: 'hero', label: 'Create Quote' });
              }}
            >
              Create Quote
            </Button>
          </div>
          <div className="hero-social-proof" aria-label="Product notes">
            <span>Free to start</span>
            <span>Built for independent professionals</span>
          </div>
        </div>
      </header>

      <section className="section-product-preview">
        <HeroProductDemo />
      </section>

      <div className="transition-block02-light-scope">
        <WorkflowContinuitySection />
      </div>

      <ScopeClaritySection />

      <section id="why-corvioz" className="section section-why section-why--editorial">
        <div className="landing-section-container landing-section-container--wide why-editorial-layout">
          <div className="why-editorial-intro">
            <p className="section-kicker">Why Corvioz</p>
            <h2 className="section-title">Built for independent professionals.</h2>
            <p className="section-lede">
              A focused operating record for the client-facing work that happens before, between, and after documents.
            </p>
          </div>

          <div className="why-editorial-list">
            <article className="why-editorial-item">
              <span className="why-editorial-number">01</span>
              <div>
                <h3>Make scope clear before approval.</h3>
                <p>Put deliverables, usage rights, exclusions, and payment terms in one document clients can review.</p>
              </div>
            </article>
            <article className="why-editorial-item">
              <span className="why-editorial-number">02</span>
              <div>
                <h3>Keep every client decision connected.</h3>
                <p>Preserve the relationship between the quote, the approval, the invoice, and the project record.</p>
              </div>
            </article>
            <article className="why-editorial-item">
              <span className="why-editorial-number">03</span>
              <div>
                <h3>Own the record after the project ends.</h3>
                <p>Your documents and client history remain part of a working archive you can return to.</p>
              </div>
            </article>
          </div>

          <div className="why-editorial-facts">
            <span>Subscriptions handled through Paddle</span>
            <span>Privacy-focused client data controls</span>
            <Link href="/trust">Read the trust principles</Link>
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
              Save 20% when billed yearly
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
                Yearly
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

      <section id="resources" className="section section-resources section-resources--editorial">
        <div className="landing-section-container landing-section-container--narrow">
          <div className="section-header u-text-center">
            <p className="section-kicker">Resources</p>
            <h2 className="section-title">Practical guides for client work.</h2>
          </div>
          <div className="resource-editorial-list">
            {resources.map((resource) => (
              <Link key={resource.href} href={resource.href} className="resource-editorial-item">
                <div>
                  <h3>{resource.title}</h3>
                  <p>{resource.description}</p>
                </div>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="section section-faq section-faq--editorial">
        <div className="landing-section-container landing-section-container--faq u-text-center">
          <p className="section-kicker">FAQ</p>
          <h2 className="section-title">Questions before you start</h2>
          <div className="faq-list">
            {faqs.map((item, idx) => (
              <div key={item.q} className="faq-item">
                <button type="button" onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                  <span>{item.q}</span>
                  <span>{activeFaq === idx ? '−' : '+'}</span>
                </button>
                {activeFaq === idx && <p>{item.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="transparency" className="section section-transparency section-transparency--editorial">
        <div className="landing-section-container landing-section-container--wide founder-note-layout">
          <div className="founder-note-copy">
            <span className="transparency-label">A note from Duo</span>
            <h2>Independent professionals should not need a finance team to run a clear client process.</h2>
            <p>
              Corvioz began with a simple frustration: quotes, client decisions, invoices, and project records were spread across tools that did not understand how the work connected.
            </p>
            <p>
              We are building a quieter, more focused system for keeping that client-facing record clear from the first quote onward.
            </p>
            <strong className="transparency-sig">Duo · Founder, Corvioz</strong>
          </div>
          <div className="founder-promises">
            <p className="section-kicker">Our principles</p>
            <ul>
              <li>Your client records remain yours.</li>
              <li>No fake urgency or manipulative pricing.</li>
              <li>No data resale.</li>
              <li>Focused workflows, not accounting bloat.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="final-cta" className="section section-final-cta section-final-cta--ink">
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
            Free to start during early access.
          </p>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
