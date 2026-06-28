'use client';

/*
 * Starter Dashboard — Corvioz v10
 * Plan: 'pro' ($9/mo) — "First Client Closure Engine"
 *
 * This is NOT a feature gating system.
 * This is a revenue track system.
 * Each tier is an independent product experience.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/app/lib/supabase-client';
import { getExpressionConfig } from 'lib/expression/expressionEngine';
import { getSuccessMomentNudge } from 'lib/expression/revenueTrigger';
import { SuccessMomentBanner } from '@/components/ui/SuccessMomentBanner';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import Dashboard from './Dashboard';

export default function StarterDashboard({ initialTool = null }) {
  const expr = getExpressionConfig('pro');
  const [activeNudge, setActiveNudge] = useState(null);
  const router = useRouter();

  const fireNudge = (moment) => {
    const nudge = getSuccessMomentNudge(moment, 'pro');
    if (nudge) setActiveNudge(nudge);
  };

  // Expose nudge trigger globally so Dashboard.js can call it after actions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__corvioz_fire_success_nudge = fireNudge;
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__corvioz_fire_success_nudge = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* Tier identity band — top of sidebar */}
      <style>{`
        .dashboard-sidebar-brand::after {
          content: 'Starter';
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      {/* Render the main Dashboard in live mode — it has all the data hooks */}
      <Dashboard
        mode="live"
        initialTool={initialTool}
        tierPlan="pro"
        onSuccessMoment={fireNudge}
      />

      {/* Non-blocking success moment nudge — slides in from bottom */}
      <SuccessMomentBanner
        nudge={activeNudge}
        onDismiss={() => setActiveNudge(null)}
      />
    </div>
  );
}
