// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import { shadowValidatePlanRead } from '../src/core/state/planStateAdapter';
import { recordDecisionTelemetry } from '../src/core/telemetry/decisionTelemetry';

export interface Entitlements {
  invoice: boolean;
  export_pdf: boolean;
  client_portal: boolean;
  crm: boolean;
  automation: boolean;
  advanced_invoicing: boolean;
  unlimited_invoices: boolean;
}

/** All plan keys considered "paid" (non-free). */
export const PAID_PLANS = ['starter', 'pro', 'studio'] as const;

/** Returns true if the given plan string is a paid tier. */
export function isPaidPlan(plan?: string | null): boolean {
  return PAID_PLANS.includes(String(plan || '').toLowerCase() as any);
}

export function getUserEntitlements(userPlan?: string | null): Entitlements {
  const plan = String(userPlan || 'free').toLowerCase();
  if (process.env.NODE_ENV !== 'production') {
    shadowValidatePlanRead(
      'entitlements.userPlan',
      plan,
      { explicitPlan: plan },
      'lib/entitlements.ts:getUserEntitlements',
      console,
    );
  }

  // Starter ($9 plan): Single Client Closure Engine.
  // Locked: Invoice, CRM/Client tracking, PDF exports. Only allows Proposal and watermarked shares.
  if (plan === 'starter') {
    const result = {
      invoice: false,
      export_pdf: false,
      client_portal: false,
      crm: false,
      automation: false,
      advanced_invoicing: false,
      unlimited_invoices: false,
    };
    recordDecisionTelemetry({
      source: 'lib/entitlements.ts:getUserEntitlements',
      decisionType: 'feature gating',
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ['FEATURE_GATE', 'LOG_ONLY', 'v5.2.1'],
    });
    return result;
  }

  // Pro ($19 plan): Freelance Operating System.
  // Allowed: Invoice generation, Quote creation, basic CRM client tracking, PDF export (no watermark), clean share links.
  if (plan === 'pro') {
    const result = {
      invoice: true,
      export_pdf: true,
      client_portal: true,
      crm: true,
      automation: false,
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
    recordDecisionTelemetry({
      source: 'lib/entitlements.ts:getUserEntitlements',
      decisionType: 'feature gating',
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ['FEATURE_GATE', 'EXPORT_PERMISSION', 'LOG_ONLY', 'v5.2.1'],
    });
    return result;
  }

  // Studio plan: Agency Execution Layer.
  // Allowed: Multi-client workspace (2-3 clients), batch exports, brand kits, reusable templates, priority AI.
  if (plan === 'studio') {
    const result = {
      invoice: true,
      export_pdf: true,
      client_portal: true,
      crm: true,
      automation: true, // Used to gate Brand Kit & Batch operations
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
    recordDecisionTelemetry({
      source: 'lib/entitlements.ts:getUserEntitlements',
      decisionType: 'feature gating',
      legacyOutput: result,
      adapterOutput: { plan, entitlements: result },
      tags: ['FEATURE_GATE', 'EXPORT_PERMISSION', 'LOG_ONLY', 'v5.2.1'],
    });
    return result;
  }

  // Default / 'free'
  const result = {
    invoice: false,
    export_pdf: false,
    client_portal: false,
    crm: false,
    automation: false,
    advanced_invoicing: false,
    unlimited_invoices: false,
  };
  recordDecisionTelemetry({
    source: 'lib/entitlements.ts:getUserEntitlements',
    decisionType: 'feature gating',
    legacyOutput: result,
    adapterOutput: { plan, entitlements: result },
    tags: ['FEATURE_GATE', 'EXPORT_PERMISSION', 'LOG_ONLY', 'v5.2.1'],
  });
  return result;
}

export async function canAccess(userId: string, feature: string): Promise<boolean> {
  if (!userId) return false;

  // 1. Client-side Check
  if (typeof window !== 'undefined') {
    // First try querying via client-side Supabase client (direct RLS lookup)
    try {
      const { createBrowserSupabaseClient } = require('../src/app/lib/supabase-client');
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from('entitlements')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (data && feature in data) {
          return !!data[feature];
        }
      }
    } catch (err) {
      console.warn('Direct client entitlements check failed, falling back to API fetch:', err);
    }

    // Fallback to calling our dedicated API endpoint
    try {
      const res = await fetch(`/api/user/entitlements?feature=${encodeURIComponent(feature)}`);
      if (res.ok) {
        const result = await res.json();
        return !!result.access;
      }
    } catch (err) {
      console.error('API fallback for canAccess failed:', err);
    }
    return false;
  }

  // 2. Server-side Check (Node.js API routes)
  try {
    const { createServiceSupabaseClient } = require('../src/app/lib/supabase');
    const supabase = createServiceSupabaseClient();
    if (supabase) {
      const { data } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && feature in data) {
        return !!data[feature];
      }

      // If no entitlements row exists, fallback to reading user plan from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        const plan = String(profile.plan || 'free').toLowerCase();
        const mapped = getUserEntitlements(plan);
        return !!mapped[feature as keyof Entitlements];
      }
    }
  } catch (err) {
    console.error('Server-side canAccess check error:', err);
  }

  return false;
}
