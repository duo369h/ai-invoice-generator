'use client';

import React from 'react';
import { Icons } from '../../styles/icons';
import { Badge } from './Badge';
import { saveSelectedPlan } from '@/app/lib/intent-store';
import { trackUpgradeClick } from 'lib/monetization/revenueEvents';
import Link from 'next/link';
import { DecisionExplanationPanel } from './DecisionExplanationPanel';
import { getValueCaptureMessage } from '../../core/monetization/valueCapture';

export function ExportRestrictionModal({
  isOpen,
  onClose,
  onDownloadFree,
  source = 'export_click',
  explanation = null,
  intentBreakdown = null,
  documentType = 'invoice',
}) {
  const [plans, setPlans] = React.useState([]);

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
      .catch(err => console.error('Error fetching plans in ExportRestrictionModal:', err));
    return () => {
      active = false;
    };
  }, [isOpen]);

  const getPlanVal = (planId, key, fallback) => {
    const plan = plans.find(p => p.id === planId);
    return plan && plan[key] !== undefined ? plan[key] : fallback;
  };

  if (!isOpen) return null;

  const isQuote = documentType === 'quote';
  const valueMessage = getValueCaptureMessage(isQuote ? 'quote_generated' : 'post_export');

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
      <div className="card animate-fade-in" style={{ maxWidth: '520px', width: '95%', padding: 'clamp(18px, 5vw, 32px)', background: 'var(--bg-card)', border: '1.5px solid var(--primary)', borderRadius: 'clamp(12px, 3vw, 20px)', boxShadow: 'var(--shadow-lg)', position: 'relative', textAlign: 'center' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
          aria-label="Close modal"
        >
          <Icons.Close size={20} />
        </button>

        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-glow)', border: '1.5px solid var(--primary)', display: 'flex', alignItems: 'center', margin: '0 auto 16px', justifyContent: 'center' }}>
          <Icons.FileSpreadsheet size={26} style={{ color: 'var(--primary)' }} />
        </div>

        <Badge variant="accent" style={{ marginBottom: '12px' }}>{valueMessage.badge}</Badge>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          {valueMessage.headline}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.45' }}>
          {valueMessage.body}
        </p>

        {/* Behavioral Explanation Layer */}
        <DecisionExplanationPanel
          explanation={explanation}
          intentBreakdown={intentBreakdown}
          title={isQuote ? "Why am I seeing this quote prompt?" : "Why am I seeing this prompt?"}
        />

        {/* Free vs Pro Comparison */}
        <div style={{ 
          background: 'var(--btn-secondary-bg)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workflow fit
          </p>
          
          <div style={{ display: 'grid', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Options</span>
              <span style={{ fontWeight: 'bold', width: '80px', textAlign: 'center' }}>Free</span>
              <span style={{ fontWeight: 'bold', width: '80px', textAlign: 'center', color: 'var(--accent)' }}>Pro</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-main)' }}>Clean client delivery</span>
              <span style={{ width: '80px', textAlign: 'center', color: 'var(--danger-text)' }}>Preview</span>
              <span style={{ width: '80px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>Client-Ready</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
              <span style={{ color: 'var(--text-main)' }}>Repeat {isQuote ? 'quote' : 'document'} workflow</span>
              <span style={{ width: '80px', textAlign: 'center' }}>5 {isQuote ? 'Quotes' : 'Documents'}</span>
              <span style={{ width: '80px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>Unlimited</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-main)' }}>Client portal and follow-up</span>
              <span style={{ width: '80px', textAlign: 'center', color: 'var(--danger-text)' }}>No</span>
              <span style={{ width: '80px', textAlign: 'center', color: 'var(--success-text)', fontWeight: 'bold' }}>Yes</span>
            </div>
          </div>
        </div>

        {/* Highlighted Recommended Plan */}
        <div style={{
          background: 'var(--primary-glow)',
          border: '1.5px solid var(--primary)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textAlign: 'left'
        }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '2px' }}>
              Workflow fit
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {valueMessage.roiAnchor}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--primary)' }}>
              ${getPlanVal('pro', 'price_monthly', 9)}/month
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
              or ${getPlanVal('pro', 'price_yearly', 7)}/mo billed annually
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <button 
            onClick={() => {
              if (onClose) onClose();
              if (onDownloadFree) onDownloadFree();
            }} 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '12px', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}
          >
            <Icons.Download size={15} />
            {valueMessage.secondaryCta} (Free)
          </button>
          <Link 
            href="/pricing?checkout=pro" 
            onClick={() => {
              if (onClose) onClose();
              saveSelectedPlan('pro', source);
              trackUpgradeClick(source, 'pro');
            }} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
          >
            {valueMessage.primaryCta}
          </Link>
        </div>
      </div>
    </div>
  );
}
