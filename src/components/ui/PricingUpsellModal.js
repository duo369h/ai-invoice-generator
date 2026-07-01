'use client';

/**
 * GLOBAL UX PRINCIPLES:
 * RULE 1: Every screen must have ONE primary action only
 * RULE 2: Every monetization event must be observable (never silent)
 * RULE 3: First invoice must never be blocked
 * RULE 4: Pricing message must match outcome promise
 * RULE 5: Remove all competing CTAs above fold
 */

import React from 'react';
import { Icons } from '../../styles/icons';
import { Card } from './Card';
import { Badge } from './Badge';
import { saveSelectedPlan } from '@/app/lib/intent-store';
import { trackUpgradeClick } from 'lib/monetization/revenueEvents';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import Link from 'next/link';
import { DecisionExplanationPanel } from './DecisionExplanationPanel';
import { getPricingAnchorCopy, getValueCaptureMessage } from '../../core/monetization/valueCapture';

export function PricingUpsellModal({
  isOpen,
  onClose,
  source = 'pricing_upsell_modal',
  explanation = null,
  intentBreakdown = null,
}) {
  const [plans, setPlans] = React.useState([]);

  React.useEffect(() => {
    if (isOpen) {
      trackEvent('pro_upgrade_view', { source: source });
      trackEvent('studio_upgrade_view', { source: source });
    }
  }, [isOpen, source]);

  React.useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (active && data.success && data.plans) {
          setPlans(data.plans);
        }
      })
      .catch(err => console.error('Error fetching plans in PricingUpsellModal:', err));
    return () => { active = false; };
  }, [isOpen]);

  const getPlanVal = (planId, key, fallback) => {
    const plan = plans.find(p => p.id === planId);
    return plan && plan[key] !== undefined ? plan[key] : fallback;
  };

  if (!isOpen) return null;
  const valueMessage = getValueCaptureMessage('usage_threshold');

  const handlePlanSelect = (plan) => {
    saveSelectedPlan(plan, source);
    trackUpgradeClick(source, plan);
    if (onClose) onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '820px', width: '95%', padding: '36px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', position: 'relative', overflowY: 'auto', maxHeight: '90vh' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          aria-label="Close modal"
        >
          <Icons.Close size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Badge variant="accent" style={{ marginBottom: '8px' }}>{valueMessage.badge}</Badge>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>{valueMessage.headline}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{valueMessage.body}</p>
        </div>

        <DecisionExplanationPanel
          explanation={explanation}
          intentBreakdown={intentBreakdown}
          title="Why am I seeing this pricing prompt?"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Pro Plan — MAIN */}
          <Card style={{ padding: '24px', border: '1.5px solid var(--primary)', boxShadow: 'var(--shadow-md)', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--primary)', color: 'var(--white)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.05em' }}>⭐ MAIN PLAN</span>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{getPlanVal('pro', 'name', 'Pro')} — Earn</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>${getPlanVal('pro', 'price_monthly', 12)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mo</span>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '12px', textAlign: 'right', fontWeight: 600 }}>
                or ${getPlanVal('pro', 'price_yearly', 10)}/mo billed annually
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {getPricingAnchorCopy('pro')}
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Paddle-secure subscription checkout</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Professional invoice templates</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Client detail auto-fill presets</li>
              </ul>
            </div>
            <Link 
              href="/pricing?checkout=pro"
              onClick={() => handlePlanSelect('pro')}
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
            >
              {valueMessage.primaryCta}
            </Link>
          </Card>

          {/* Studio Plan */}
          <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{getPlanVal('studio', 'name', 'Studio')} — Scale</h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>${getPlanVal('studio', 'price_monthly', 29)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mo</span>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-4px', marginBottom: '12px', textAlign: 'right', fontWeight: 600 }}>
                or ${getPlanVal('studio', 'price_yearly', 24)}/mo billed annually
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {getPricingAnchorCopy('studio')}
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Everything in Pro</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Custom domain white-labeling</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icons.Check size={14} style={{ color: 'var(--success)' }} /> Smart automated reminders</li>
              </ul>
            </div>
            <Link 
              href="/pricing?checkout=agency"
              onClick={() => handlePlanSelect('agency')}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'center', textDecoration: 'none' }}
            >
              Scale client operations
            </Link>
          </Card>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 650 }}>
            🔒 TLS Encrypted Paddle Checkout • 14-Day Refund Window • Cancel Anytime
          </span>
        </div>
      </div>
    </div>
  );
}
