'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../../styles/icons';
import { saveSelectedPlan } from '@/app/lib/intent-store';
import { trackUpgradeClick } from 'lib/monetization/revenueEvents';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
const trackIntentAction = () => {};
const trackFunnelEvent = () => {};

export function UpgradeModal({
  isOpen,
  onClose,
  title = 'Upgrade to Corvioz Pro',
  description = 'Manage workflow complexity and grow your freelance business.',
  lockedFeatureValue = 'Unlimited clients, quotes, and invoices',
  limit = '',
  source = 'dashboard_upgrade_modal',
  explanation = null,
  intentBreakdown = null,
  targetPlan = 'pro',
}) {
  const [plans, setPlans] = React.useState([]);

  React.useEffect(() => {
    if (isOpen) {
      trackEvent('pro_upgrade_view', { source: source });
      trackIntentAction('OPEN_MODAL');
      trackFunnelEvent('modal_open', { source });
    }
  }, [isOpen, source]);

  React.useEffect(() => {
    let active = true;
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (active && data.success && data.plans) {
          setPlans(data.plans);
        }
      })
      .catch(err => console.error('Error fetching plans in UpgradeModal:', err));
    return () => {
      active = false;
    };
  }, []);

  const getPlanVal = (planId, key, fallback) => {
    const plan = plans.find(p => p.id === planId);
    return plan && plan[key] !== undefined ? plan[key] : fallback;
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '90%', padding: '40px', background: 'var(--bg-card)', border: '2px solid var(--primary)', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          aria-label="Close modal"
        >
          <Icons.Close size={20} />
        </button>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--primary-glow)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', margin: '0 auto 20px', justifyContent: 'center' }}>
          <Icons.Sparkles size={32} style={{ color: 'var(--primary)' }} />
        </div>

        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: '1.3' }}>
          {title || "Unlock a more professional way to get paid."}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: '1.5', fontWeight: 500 }}>
          {description || "Used by freelancers who close more clients."}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link 
            href={targetPlan === 'support' ? 'mailto:support@corvioz.com' : `/checkout?plan=${targetPlan}&intent=high`}
            onClick={() => {
              if (onClose) onClose();
              saveSelectedPlan(targetPlan, source || 'dashboard_upgrade_modal');
              trackUpgradeClick(source || 'dashboard_upgrade_modal', targetPlan);
            }} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '1rem', fontWeight: 800, textAlign: 'center', textDecoration: 'none', borderRadius: '12px' }}
          >
            {targetPlan === 'support' 
              ? 'Contact Support' 
              : targetPlan === 'pro' 
              ? 'Get paid faster' 
              : targetPlan === 'growth' 
              ? 'Never miss a payment' 
              : (targetPlan === 'studio' || targetPlan === 'agency') 
              ? 'Scale client operations' 
              : 'Upgrade now'}
          </Link>
          <button 
            onClick={onClose} 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
          >
            Maybe Later
          </button>
        </div>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
          <span>Plans start at just ${getPlanVal('pro', 'price_monthly', 12)}/mo. 🛡️ 14-Day Money-Back Guarantee.</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-soft)', fontWeight: 650 }}>🔒 TLS Encrypted Safe Stripe Payment • Cancel or Downgrade in 1-Click</span>
        </p>
      </div>
    </div>
  );
}
