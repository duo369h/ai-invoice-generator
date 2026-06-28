'use client';

/*
 * Studio Dashboard — Corvioz v10
 * Plan: 'studio' ($29/mo) — "Client Growth Pack"
 *
 * This is NOT a feature gating system.
 * This is a revenue track system.
 * Each tier is an independent product experience.
 */

import React, { useState, useEffect } from 'react';
import { getExpressionConfig } from 'lib/expression/expressionEngine';
import { SuccessMomentBanner } from '@/components/ui/SuccessMomentBanner';
import Dashboard from './Dashboard';

export default function StudioDashboard({ initialTool = null }) {
  const expr = getExpressionConfig('studio');
  // Studio users see no upgrade nudges — they are at the top tier
  // Future: could show retention nudges or annual upgrade suggestions

  return (
    <div style={{ position: 'relative' }}>
      <style>{`
        .dashboard-sidebar-brand::after {
          content: 'Studio';
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
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
        tierPlan="studio"
        onSuccessMoment={null}
      />
    </div>
  );
}
