'use client';

/*
 * SuccessMomentBanner — Corvioz v10
 *
 * Non-blocking upgrade nudge that fires AFTER a value moment.
 * Renders as a slide-in bottom bar — NOT a modal, NOT an access block.
 *
 * This is the ONLY upgrade nudge surface allowed in the v10 system.
 * All lock screens and modal interruptions must be replaced with this.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { saveSelectedPlan } from '@/app/lib/intent-store';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

export function SuccessMomentBanner({ nudge, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (nudge && !dismissed) {
      // Small delay for visual polish — lets the action complete first
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [nudge, dismissed]);

  useEffect(() => {
    if (visible && nudge) {
      trackEvent('success_moment_nudge_shown', {
        moment: nudge.moment,
        source: nudge.source,
        targetPlan: nudge.targetPlan,
      });
    }
  }, [visible, nudge]);

  if (!nudge || dismissed) return null;

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    trackEvent('success_moment_nudge_dismissed', { source: nudge.source });
    if (onDismiss) onDismiss();
  };

  const handleUpgrade = () => {
    saveSelectedPlan(nudge.targetPlan, nudge.source);
    trackEvent('success_moment_nudge_clicked', {
      moment: nudge.moment,
      source: nudge.source,
      targetPlan: nudge.targetPlan,
    });
  };

  return (
    <div
      className={`success-moment-banner ${visible ? 'visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {/* Pulse dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 8px var(--success)',
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '0.875rem',
            margin: 0,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {nudge.headline}
          </p>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.78rem',
            margin: '2px 0 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {nudge.outcome}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Link
          href={`/checkout?plan=${nudge.targetPlan}&intent=high`}
          onClick={handleUpgrade}
          style={{
            background: 'linear-gradient(135deg, var(--indigo-500), var(--primary))',
            color: 'var(--white)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-block',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 16px rgba(79,70,229,0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          {nudge.ctaLabel}
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss upgrade suggestion"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-soft)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: '6px 10px',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
