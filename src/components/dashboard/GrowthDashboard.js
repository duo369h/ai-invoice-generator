'use client';

/*
 * Growth Dashboard — Corvioz v10
 * Plan: 'growth' ($19/mo) — "Income Engine"
 *
 * This is NOT a feature gating system.
 * This is a revenue track system.
 * Each tier is an independent product experience.
 */

import React, { useState, useEffect } from 'react';
import { getExpressionConfig } from 'lib/expression/expressionEngine';
import { getSuccessMomentNudge } from 'lib/expression/revenueTrigger';
import { SuccessMomentBanner } from '@/components/ui/SuccessMomentBanner';
import Dashboard from './Dashboard';

export default function GrowthDashboard({ initialTool = null }) {
  const expr = getExpressionConfig('growth');
  const [activeNudge, setActiveNudge] = useState(null);

  const fireNudge = (moment) => {
    const nudge = getSuccessMomentNudge(moment, 'growth');
    if (nudge) setActiveNudge(nudge);
  };

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
      <style>{`
        .dashboard-sidebar-brand::after {
          content: 'Pro';
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #059669, #10b981);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      <Dashboard
        mode="live"
        initialTool={initialTool}
        tierPlan="growth"
        onSuccessMoment={fireNudge}
      />

      <SuccessMomentBanner
        nudge={activeNudge}
        onDismiss={() => setActiveNudge(null)}
      />
    </div>
  );
}
