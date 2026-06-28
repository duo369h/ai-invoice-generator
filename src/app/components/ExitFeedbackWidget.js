'use client';

import { useState, useEffect, useCallback } from 'react';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

// ---------- Upgrade Rejection Survey ----------
// Call this when a user closes an upgrade / paywall modal.
export function trackUpgradeRejection(planKey, billingPeriod = 'monthly') {
  if (typeof window === 'undefined') return;
  const STORAGE_KEY = 'corvioz_upgrade_rejection_tracked';
  // Only ask once per session
  if (sessionStorage.getItem(STORAGE_KEY)) return;
  sessionStorage.setItem(STORAGE_KEY, '1');

  // Fire the base rejection event immediately
  trackEvent('upgrade_rejected', {
    plan: planKey,
    billing_period: billingPeriod,
    event_source: 'user',
  });

  // Render a subtle inline survey prompt — caller should handle UI
  // by showing the <UpgradeRejectionPrompt> component.
}

// Exported tracking helper for activation analysis
export function trackActivationStatus({ invoiceCount, quoteCount, exportCount }) {
  if (typeof window === 'undefined') return;

  const activated = (invoiceCount > 0 || quoteCount > 0) && exportCount > 0;
  const created = invoiceCount > 0 || quoteCount > 0;

  if (created && !activated) {
    trackEvent('activation_incomplete', {
      invoice_count: invoiceCount,
      quote_count: quoteCount,
      export_count: exportCount,
      drop_stage: 'created_not_exported',
      event_source: 'system',
    });
  } else if (activated) {
    trackEvent('activation_complete', {
      invoice_count: invoiceCount,
      quote_count: quoteCount,
      export_count: exportCount,
      event_source: 'system',
    });
  }
}

// ---------- Exit Feedback Survey Widget ----------
const EXIT_REASONS = [
  { id: 'just_testing', label: 'Just testing for now' },
  { id: 'couldnt_find', label: 'Couldn\'t find what I needed' },
  { id: 'export_limitation', label: 'Export or watermark limitation' },
  { id: 'pricing', label: 'Pricing — not ready to upgrade' },
  { id: 'something_else', label: 'Something else' },
];

const UPGRADE_REJECTION_REASONS = [
  { id: 'too_expensive', label: 'Too expensive right now' },
  { id: 'not_ready', label: 'Not ready yet, still exploring' },
  { id: 'just_testing', label: 'Just testing the tool' },
  { id: 'need_features', label: 'Need to see more features first' },
];

export function UpgradeRejectionPrompt({ planKey, billingPeriod = 'monthly', onClose }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    trackEvent('upgrade_rejection_reason', {
      plan: planKey,
      billing_period: billingPeriod,
      reason: selected,
      event_source: 'user',
    });
    setSubmitted(true);
    setTimeout(() => onClose?.(), 1200);
  };

  if (submitted) {
    return (
      <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', textAlign: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thank you for your feedback.</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '18px 20px', borderRadius: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>What stopped you from upgrading?</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {UPGRADE_REJECTION_REASONS.map((reason) => (
          <button
            key={reason.id}
            onClick={() => setSelected(reason.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: selected === reason.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              background: selected === reason.id ? 'var(--primary-glow)' : 'var(--btn-secondary-bg)',
              color: selected === reason.id ? 'var(--primary)' : 'var(--text-soft)',
              fontSize: '0.8rem',
              fontWeight: selected === reason.id ? 700 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            {reason.label}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected}
        className="btn btn-primary btn-sm"
        style={{ alignSelf: 'flex-end', opacity: selected ? 1 : 0.5 }}
      >
        Submit
      </button>
    </div>
  );
}

// ---------- Exit Survey Widget (shown once per session) ----------
export default function ExitFeedbackWidget() {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const show = useCallback(() => {
    if (typeof window === 'undefined') return;
    const already = sessionStorage.getItem('corvioz_exit_survey_shown');
    if (already || dismissed) return;
    setVisible(true);
  }, [dismissed]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const already = sessionStorage.getItem('corvioz_exit_survey_shown');
    if (already) return;

    // Show on mouse leaving the top of the viewport (classic exit intent)
    const handleMouseLeave = (e) => {
      if (e.clientY < 20) {
        show();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [show]);

  const handleDismiss = () => {
    sessionStorage.setItem('corvioz_exit_survey_shown', '1');
    setDismissed(true);
    setVisible(false);
    trackEvent('exit_survey_dismissed', { event_source: 'user' });
  };

  const handleSubmit = () => {
    if (!selected) return;
    trackEvent('exit_survey_completed', {
      reason: selected,
      event_source: 'user',
    });
    sessionStorage.setItem('corvioz_exit_survey_shown', '1');
    setSubmitted(true);
    setTimeout(() => setVisible(false), 2000);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick feedback survey"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9000,
        width: '320px',
        background: 'var(--background-card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        animation: 'fade-in 0.3s ease',
      }}
    >
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 4px 0' }}>Thank you!</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Your feedback helps us improve Corvioz.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Quick question</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>What stopped you today?</p>
            </div>
            <button
              id="exit-survey-close"
              onClick={handleDismiss}
              aria-label="Close feedback survey"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1, padding: '2px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {EXIT_REASONS.map((reason) => (
              <button
                key={reason.id}
                id={`exit-reason-${reason.id}`}
                onClick={() => setSelected(reason.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '7px',
                  border: selected === reason.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  background: selected === reason.id ? 'var(--primary-glow)' : 'var(--btn-secondary-bg)',
                  color: selected === reason.id ? 'var(--primary)' : 'var(--text-soft)',
                  fontSize: '0.8rem',
                  fontWeight: selected === reason.id ? 700 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={handleDismiss}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              Skip
            </button>
            <button
              id="exit-survey-submit"
              onClick={handleSubmit}
              disabled={!selected}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.75rem', opacity: selected ? 1 : 0.5 }}
            >
              Submit
            </button>
          </div>
        </>
      )}
    </div>
  );
}
