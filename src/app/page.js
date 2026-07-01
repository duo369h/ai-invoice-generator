'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card } from './components/UIComponents';
import PublicHeader from './components/PublicHeader';
import SharedFooter from './components/SharedFooter';
import { sendEvent as trackEvent } from './lib/analytics';
import { trackHeroCtaClick, trackLandingViewed, trackPricingClick } from './lib/product-analytics';
import { saveIntendedRoute, saveSelectedPlan } from './lib/intent-store';
import { calculatePlanPrice } from '../core/pricing/pricingDeterministicMapper';

const resources = [
  { title: 'Freelance Pricing Guide', href: '/blog/how-to-price-web-design-projects' },
  { title: 'How to Get Paid Faster', href: '/blog/best-invoice-software-for-freelancers' },
  { title: 'Invoice vs Quote vs Receipt', href: '/blog/invoice-vs-quote-vs-receipt' },
];

const faqs = [
  {
    q: 'Why Corvioz instead of invoicing software?',
    a: 'Corvioz starts before the invoice. It helps freelancers create a quote, turn it into a proposal, send the invoice, and keep the client workflow in one workspace.',
  },
  {
    q: 'Who is Corvioz built for?',
    a: 'Corvioz is built for freelancers, consultants, designers, developers, photographers, and small studios that need a clear quote-to-invoice workflow without a heavy accounting suite.',
  },
  {
    q: 'Can I manage recurring clients?',
    a: 'Yes. You can keep client records, reuse quote and invoice details, and manage repeat work from the same dashboard.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'Paid subscriptions are processed through Paddle where checkout is enabled. Client payment options depend on the payment links and billing setup available in your account.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can move between Free, Starter, and Pro as your client workflow changes, without changing your existing quotes, invoices, or client records.',
  },
  {
    q: 'Can I cancel before renewal?',
    a: 'Yes. You can cancel future renewal before the next billing period or request billing support without cancellation fees or long-term contracts.',
  },
  {
    q: 'How do refunds work?',
    a: 'Paid upgrades include a clear 14-day refund window when processed through Paddle. Email support@corvioz.com with your account email and Paddle receipt.',
  },
  {
    q: 'Who owns my data?',
    a: 'You own your invoices, quotes, proposals, client records, and exported documents. Corvioz does not sell personal data.',
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
    a: 'Corvioz uses Supabase for authentication and database storage, Paddle for subscription billing, and scoped access patterns for account data.',
  },
  {
    q: 'Do clients need an account?',
    a: 'No. Clients can review shared quote, proposal, invoice, and portal links without creating a Corvioz account.',
  },
  {
    q: 'Can I customize invoices?',
    a: 'Yes. Corvioz supports professional invoice details and paid tiers add stronger branding and delivery controls.',
  },
  {
    q: 'Can I use my own branding?',
    a: 'Yes. Branding options depend on your plan, with paid tiers designed for freelancers who want more polished client delivery.',
  },
  {
    q: 'Is Corvioz full accounting software?',
    a: 'No. Corvioz is a client workflow workspace for quotes, proposals, invoices, and client records. It does not replace bookkeeping or tax software.',
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
    { icon: '01', label: 'Quote', text: '$3,200 milestone estimate', badge: 'Drafted' },
    { icon: '02', label: 'Accepted', text: 'Client approval captured', badge: 'Ready' },
    { icon: '03', label: 'Invoice', text: 'Payment link delivered', badge: 'Sent' },
    { icon: '04', label: 'Paid', text: 'Transfer recorded', badge: 'Completed' },
    { icon: '$3.2k', label: 'Revenue', text: 'Workspace balance updated', badge: 'Received', isOutcome: true }
  ];

  return (
    <div className="hero-product-card" aria-label="Corvioz product preview">
      <div className="product-topbar">
        <div className="window-dots"><span /><span /><span /></div>
        <span>workspace / quotes</span>
        <span>Live workflow preview</span>
      </div>
      <div className="product-preview-header">
        <div>
          <span className="preview-label">Client billing flow</span>
          <h3>Quote to paid, in one workspace.</h3>
        </div>
        <div className="preview-summary-pill">5 steps tracked</div>
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
            const STRICT_PLAN_IDS = ['free', 'starter', 'pro', 'studio'];
            const uniquePlansMap = new Map();
            data.plans.forEach((plan) => {
              if (plan && plan.id && !uniquePlansMap.has(plan.id)) {
                uniquePlansMap.set(plan.id, plan);
              }
            });
            const orderedPlans = STRICT_PLAN_IDS
              .map((id) => uniquePlansMap.get(id))
              .filter(Boolean);
            setPlans(orderedPlans);
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

  return (
    <main className="landing-page">
      <PublicHeader
          className="navbar landing-nav"
          surfaceId="home-global-control-surface"
          route="/"
          navLinks={[
            { label: 'Why Corvioz', href: '#why-corvioz' },
            { label: 'How it Works', href: '#how-corvioz-works' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Resources', href: '#resources' },
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
            Early Access for Freelancers
          </div>
          <h1 className="hero-title">
            Turn client requests<br />
            <span className="glow-gradient-text">into paid work.</span>
          </h1>
          <p className="hero-lede">
            Create a quote, turn it into a proposal, send the invoice, and keep every client step moving in one workspace.
          </p>

          <div className="hero-actions">
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              className="btn-hero-primary"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                trackHeroCtaClick({ cta_name: 'Create Quote', position: 'hero' });
                trackEvent('cta_click', { cta_name: 'Create Quote', position: 'hero' });
              }}
            >
              Create Quote
            </Button>
            <Button
              href="/demo"
              variant="secondary"
              size="lg"
              className="btn-hero-secondary"
              onClick={() => { trackHeroCtaClick({ cta_name: 'Explore Example', position: 'hero' }); trackEvent('cta_click', { cta_name: 'Explore Example', position: 'hero' }); }}
            >
              Explore Example
            </Button>
          </div>
          <div className="hero-social-proof">
            <span>No credit card required</span>
            <span>Free during Early Access</span>
            <span>Built with real freelancer feedback</span>
          </div>
        </div>
      </header>

      <section className="section-product-preview">
        <ProductPreview />
      </section>

      <section id="how-corvioz-works" className="section section-how-it-works">
        <div className="landing-section-container landing-section-container--narrow u-text-center">
          <p className="section-kicker">How Corvioz Works</p>
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
            <h2 className="section-title">Built for Independent Freelancers</h2>
            <p className="section-lede">The simple, professional workspace to handle billing, client management, and portfolios without subscription creep.</p>
          </div>

          <div className="why-cards-grid">
            <div className="card why-card">
              <h3 className="card-heading">Work more professionally</h3>
              <p className="card-body">
                Send quotes, invoices, and client updates from one workspace.
              </p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Charge with confidence</h3>
              <p className="card-body">
                Track project outcomes and build confidence in future pricing decisions.
              </p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Stay in control</h3>
              <p className="card-body">
                Your projects, your clients, your data. No lock-in.
              </p>
            </div>
          </div>

          <div className="trust-badges-row">
            <span>Secure subscription billing via Paddle</span>
            <span className="trust-divider">|</span>
            <span>GDPR &amp; CCPA Compliant</span>
            <span className="trust-divider">|</span>
            <span>No Credit Card Required to Try</span>
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
            <p className="section-lede">Explore the visual structure and interface layouts of the Corvioz workspace. No fake testimonials, no mock logos, just real product outlines.</p>
          </div>

          <div className="trust-stats-grid">
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--primary">Freelancer Focus</span>
              <h3 className="trust-stat-heading">Built for real freelancers</h3>
              <p className="trust-stat-body">
                A focused, lightweight workspace built specifically for independent professionals, sole proprietors, and consultants.
              </p>
            </Card>
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--success">Global Trust</span>
              <h3 className="trust-stat-heading">Used worldwide</h3>
              <p className="trust-stat-body">
                Freelancers use Corvioz to draft milestone quotes, send professional invoices, and collect client payments worldwide.
              </p>
            </Card>
            <Card className="trust-stat-card">
              <span className="trust-stat-label trust-stat-label--accent">Active Development</span>
              <h3 className="trust-stat-heading">Early Access</h3>
              <p className="trust-stat-body">
                We grow with real feedback. We prioritize simple, direct freelance billing workflows over complex systems and algorithms.
              </p>
            </Card>
          </div>

          <div className="screenshot-gallery-grid">
            <div className="product-preview-card">
              <div>
                <span className="preview-label">Layout 01</span>
                <h4 className="preview-heading">Freelancer Dashboard</h4>
                <p className="preview-body">
                  A focused workspace for pipeline status, active clients, open invoices, and revenue outcomes.
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
                <h4 className="preview-heading">Milestone Proposals</h4>
                <p className="preview-body">
                  Turn project scope, milestone pricing, and client approval into a clean proposal flow.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row">
                    <span className="wireframe-bar md w-60"></span>
                  </div>
                  <div className="wireframe-placeholder">
                    Proposal builder
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
                <h4 className="preview-heading">Invoice &amp; Payments</h4>
                <p className="preview-body">
                  Create branded invoices, track payment status, and keep client billing records in one place.
                </p>
              </div>
              <div className="screenshot-window-mockup">
                <div className="screenshot-window-dots"><span /><span /><span /></div>
                <div className="wireframe-box">
                  <div className="wireframe-row space-between">
                    <span className="wireframe-bar md w-40"></span>
                    <span className="wireframe-bar paid">PAID</span>
                  </div>
                  <div className="wireframe-placeholder">
                    Invoice timeline
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
                  Give clients a direct place to review proposals, invoices, approvals, and payment updates.
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
          <p className="section-lede">Start free, then upgrade when quotes, invoices, and client delivery become part of your daily workflow.</p>

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

                const { price, billedAnnuallyText } = calculatePlanPrice(plan, billingPeriod);

                const displayName = plan.name;
                const displayDescription = plan.description;
                const displayFeatures = plan.features || [];

                const ctaText = plan.id === 'free' ? 'Start Free' : isStudio ? 'Join Waitlist' : plan.id === 'starter' ? 'Get Starter' : 'Get Pro';
                const hrefVal = plan.id === 'free' ? '/dashboard?action=create-profile' : isStudio ? '/pricing' : `/pricing?checkout=${plan.id}`;
                const cardClassName = `pricing-card ${plan.id}${isPro ? ' featured' : ''}`;

                return (
                  <div key={plan.id} className={cardClassName}>
                    {isPro && (
                      <div className="pricing-badge-pill">
                        Most freelancers choose this
                      </div>
                    )}
                    <div>
                      <h3>{displayName}</h3>
                      <div className={`price-line${(billingPeriod === 'yearly' && billedAnnuallyText) ? ' u-mb-2' : ' u-mb-6'}`}>
                        {isStudio ? (
                          <strong className="price-coming-soon">Coming Soon</strong>
                        ) : (
                          <>
                            <strong>{`$${price}`}</strong>
                            <span>/month</span>
                          </>
                        )}
                      </div>
                      {billingPeriod === 'yearly' && billedAnnuallyText && (
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
                          const planKey = plan.id;
                          saveSelectedPlan(planKey, '/');
                          trackPricingClick({ position: 'pricing_card', plan: planKey });
                          trackEvent('pricing_select_plan', { position: 'pricing_card', plan: planKey });
                          trackEvent('cta_click', { cta_name: ctaText, position: 'pricing_card', plan: planKey });
                        }}
                      >
                        {ctaText}
                      </Button>

                      <div className="plan-cta-note">
                        By continuing, you agree to our <Link href="/terms">Terms</Link> &amp; <Link href="/privacy">Privacy Policy</Link>
                      </div>
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
                We built Corvioz to give freelancers a focused, fast, and beautiful workspace to handle quotes, proposals, invoices, and clients. We believe in providing value first, which is why you can try the tool with zero signup and download watermarked copies for free.&quot;
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
                Our monetization is simple: Professional Invoice Delivery, custom client portals, and CRM management are Pro features. We never sell your data, and we do not use manipulative pricing or fake urgency timers.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="final-cta" className="section section-final-cta">
        <div className="landing-section-container landing-section-container--cta u-text-center">
          <p className="section-kicker">
            Built for real freelancers
          </p>
          <h2 className="section-title">
            Ready to create your first client quote?
          </h2>
          <p className="section-lede">
            Start with a quote, move into an invoice, and keep the client workflow clear from day one.
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
            Free during early access. No credit card required.
          </p>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
