'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Logo } from './UIComponents';
import { getActivationRecommendation } from '../../core/growth/activationEngine';
import { trackGrowthEvent, recordFunnelStep, getOrAssignABVariant } from '../../core/growth/growthTracker';
import { getVariantCopy } from '../../core/growth/abTesting';

export default function GrowthLandingPage({ spec }) {
  const activation = getActivationRecommendation({ intendedAction: spec.intent });
  const [heroMsg, setHeroMsg] = useState(spec.headline);
  const [primaryCtaText, setPrimaryCtaText] = useState(spec.primaryCta);
  const [experimentVariant, setExperimentVariant] = useState('control');

  useEffect(() => {
    // 1. Record landing view funnel step
    recordFunnelStep('landing_view', { source: spec.key });

    // 2. Assign A/B variant
    const heroAssign = getOrAssignABVariant('hero_message');
    const ctaAssign = getOrAssignABVariant('primary_cta');
    
    setExperimentVariant(heroAssign.variant);
    
    // Resolve copy
    const resolvedHero = getVariantCopy('hero_message', heroAssign.variant);
    const resolvedCta = getVariantCopy('primary_cta', ctaAssign.variant);
    
    if (resolvedHero) setHeroMsg(resolvedHero);
    if (resolvedCta) setPrimaryCtaText(resolvedCta);
  }, [spec]);

  const handleCtaClick = (ctaName) => {
    trackGrowthEvent('cta_click', {
      source: spec.key,
      cta: ctaName,
      variant: experimentVariant,
      intent: spec.intent
    });
  };

  return (
    <main className="landing-page">
      <nav className="navbar landing-nav">
        <Logo />
        <div className="nav-links">
          <Link href="/pricing" className="nav-link" onClick={() => handleCtaClick('nav_pricing')}>Pricing</Link>
          <Link href="/quote-generator" className="nav-link" onClick={() => handleCtaClick('nav_quote_gen')}>Quote generator</Link>
          <Button href="/dashboard" variant="secondary" size="sm" onClick={() => handleCtaClick('nav_signin')}>Sign in</Button>
        </div>
      </nav>
 
      <header className="landing-hero animate-fade-in">
        <div className="hero-content-center">
          <div className="hero-badge">Growth landing preview</div>
          <h1 className="hero-title">{heroMsg}</h1>
          <p className="hero-lede">{spec.subheadline}</p>
          <div className="hero-actions">
            <Button href={`/dashboard?tool=${spec.intent === 'client' ? 'client' : spec.intent}`} variant="primary" size="lg" onClick={() => handleCtaClick('primary_hero_cta')}>
              {primaryCtaText}
            </Button>
            <Button href="/demo" variant="secondary" size="lg" onClick={() => handleCtaClick('secondary_hero_cta')}>
              {spec.secondaryCta}
            </Button>
          </div>
          <div className="hero-social-proof">
            <span>Preview before signup</span>
            <span>No credit card required</span>
            <span>Built around first action speed</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="landing-section-container landing-section-container--narrow">
          <div className="section-header">
            <p className="section-kicker">Activation path</p>
            <h2 className="section-title">{activation.headline}</h2>
            <p className="section-lede">{activation.reason}</p>
          </div>
          <div className="why-cards-grid">
            <div className="card why-card">
              <h3 className="card-heading">First action</h3>
              <p className="card-body">Guide the visitor to {activation.suggestedAction.replace('_', ' ')} without a broad setup detour.</p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Visible output</h3>
              <p className="card-body">Show what the invoice, quote, or client record looks like before signup friction appears.</p>
            </div>
            <div className="card why-card">
              <h3 className="card-heading">Revenue follow-up</h3>
              <p className="card-body">Connect acquisition intent to the quote-to-invoice workflow already used by Corvioz.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
