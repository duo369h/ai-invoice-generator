'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';
import { Button, Card, Logo } from './components/UIComponents';
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
      <nav className="navbar landing-nav">
        <Logo />
        <div className="nav-links desktop-only">
          <a href="#why-corvioz" className="nav-link">Why Corvioz</a>
          <a href="#how-corvioz-works" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#faq" className="nav-link">FAQ</a>

          <Button href="/dashboard" variant="secondary" size="sm" onClick={() => trackEvent('cta_click', { cta_name: 'Sign in', position: 'navbar' })}>Sign in</Button>
          <Button
            href="/dashboard?tool=quote"
            variant="primary"
            size="sm"
            className="btn-navbar-cta"
            onClick={() => {
              saveIntendedRoute('/dashboard?tool=quote', '/');
              trackEvent('signup_click', { position: 'navbar' });
              trackEvent('cta_click', { cta_name: 'Create a Quote', position: 'navbar' });
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
            <Button href="/dashboard" variant="secondary" className="u-full-width" onClick={() => { setMobileMenuOpen(false); trackEvent('cta_click', { cta_name: 'Sign in', position: 'mobile_menu' }); }}>Sign in</Button>
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              className="u-full-width u-mt-2"
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

      <header className="landing-hero animate-fade-in">
        <div className="hero-content-center">
          <div className="hero-badge">
            Early Access for Freelancers
          </div>
          <h1 className="hero-title">
            Get a price.<br />
            <span className="glow-gradient-text">Win better clients.</span>
          </h1>
          <p className="hero-lede">
            Corvioz helps freelancers create quotes, send invoices, and get paid faster.
          </p>

          <div className="hero-actions">
            <Button
              href="/dashboard?tool=quote"
              variant="primary"
              size="lg"
              className="btn-hero-primary"
              onClick={() => {
                saveIntendedRoute('/dashboard?tool=quote', '/');
                trackHeroCtaClick({ cta_name: 'Create a Quote', position: 'hero' });
                trackEvent('cta_click', { cta_name: 'Create a Quote', position: 'hero' });
              }}
            >
              Create a Quote
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
            <span>100% Secure Payments</span>
            <span className="trust-divider">|</span>
            <span>GDPR &amp; CCPA Compliant</span>
            <span className="trust-divider">|</span>
            <span>No Credit Card Required to Try</span>
          </div>
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
          <h2 className="section-title">Pick your plan.</h2>
          <p className="section-lede">Start free. Upgrade only when Corvioz becomes part of your workflow.</p>

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
                We built Corvioz to give freelancers a focused, fast, and beautiful space to handle quotes and invoices. We believe in providing value first, which is why you can try the tool with zero signup and download watermarked copies for free.&quot;
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
            Ready to win more clients?
          </h2>
          <p className="section-lede">
            Create milestone quotes, convert to invoices, and secure payments instantly.
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
                  cta_name: 'Create a Quote',
                  position: 'final_cta'
                });
              }}
            >
              Create a Quote
            </Button>
          </div>
          <p className="final-cta-note">
            Free during early access. No credit card required.
          </p>
        </div>
      </section>

      <footer className="landing-footer landing-footer-grid">
        <div>
          <Logo />
          <p>
            Get a price. Win better clients.
          </p>
          <p className="footer-tagline">Built for Freelancers in Beta</p>
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
          <Link href="/security">Security &amp; Data</Link>
        </div>

        <div className="footer-bottom">
          <p>GDPR Ready • CCPA Compliant • Secure Payments</p>
        </div>
      </footer>
    </main>
  );
}
