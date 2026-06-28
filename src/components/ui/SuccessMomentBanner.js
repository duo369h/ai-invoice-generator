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
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'linear-gradient(90deg, #0f0f1a 0%, #1e1b4b 40%, #0f0f1a 100%)',
        borderTop: '1px solid rgba(79, 70, 229, 0.4)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        gap: '16px',
        flexWrap: 'wrap',
      }}
      role="status"
      aria-live="polite"
    >
      {/* Pulse dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#4ade80',
          boxShadow: '0 0 8px #4ade80',
          flexShrink: 0,
          animation: 'pulse 2s infinite',
        }} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            color: '#f8fafc',
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
            color: '#94a3b8',
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
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff',
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
            color: '#64748b',
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

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
