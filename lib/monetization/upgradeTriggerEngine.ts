/**
 * Upgrade Trigger Engine — Corvioz v1
 *
 * Deterministic, rule-based engine that converts user behavior signals
 * into upgrade recommendations. NO AI in v1. All decisions are pure functions
 * of the input signals — no network calls, no side effects.
 *
 * v3.1.1 note: AI overlays are forbidden in this engine.
 */

import { trackEvent } from '@/app/lib/analytics';
import { isPaidPlan, PAID_PLANS } from '../entitlements';
import { getUserSegment, getSegmentThresholdOverrides } from './funnelAdapter';

export interface OptimizerConfig {
  thresholds: {
    pro_invoice_count: number;
    pro_export_count: number;
    growth_invoice_count: number;
    growth_quote_count: number;
    studio_export_count: number;
    studio_return_frequency: number;
  };
  weights: {
    usage_multiplier: number;
    behavior_multiplier: number;
    intent_multiplier: number;
    churn_risk_multiplier: number;
  };
  ui_pressure: 'soft' | 'modal' | 'hard';
  cta_strategy: 'value' | 'urgency' | 'benefit';
  last_optimized_at: string;
  version: number;
}

let runtimeConfig: OptimizerConfig | null = null;

export function updateEngineConfig(config: OptimizerConfig) {
  if (process.env.NODE_ENV === 'production') {
    console.warn("Configuration mutation is locked in production.");
    return;
  }
  runtimeConfig = config;
}

export function getEngineConfig(): OptimizerConfig | null {
  return runtimeConfig;
}

// ─── Public Types ──────────────────────────────────────────────────────────────

export interface UserSignals {
  invoice_count: number;
  quote_count: number;
  export_count: number;
  pricing_view_count: number;
  scroll_depth: number;           // 0–100 percent
  return_user_frequency: number;  // number of return dashboard visits
  is_authenticated: boolean;
  plan: string;                   // 'free' | 'pro' | 'growth' | 'studio' | 'agency'
  time_on_page?: number;          // active time on page in seconds
  tab_switch_count?: number;      // number of times user switched tabs
  session_duration?: number;      // session duration in seconds
  last_active_time?: number;      // epoch timestamp
  user_goal?: string;             // e.g. 'invoice', 'quote', 'explore'
  clicked_feature?: string;       // e.g. 'export_pdf', 'client_portal'
  selected_plan?: string;         // plan chosen or clicked by user
}

export interface UpgradeDecision {
  should_show_upgrade: boolean;
  target_plan: 'pro' | 'growth' | 'studio' | null;
  reason: string;
  confidence: number;            // 0–100
  trigger_type: 'usage' | 'intent' | 'risk' | 'revenue_opportunity';
}

/** Internal rule definition */
interface TriggerRule {
  id: string;
  target_plan: 'pro' | 'growth' | 'studio';
  trigger_type: UpgradeDecision['trigger_type'];
  confidence: number;
  reason: string;
  /** Returns true when this rule should fire */
  match: (s: UserSignals) => boolean;
}

// ─── Rule Definitions ──────────────────────────────────────────────────────────
//
// Rules are evaluated in order. The FIRST matching rule wins.
// Higher-confidence rules should appear first within each target tier.
// Studio rules take priority over Growth, Growth over Pro.

const TRIGGER_RULES: TriggerRule[] = [
  // ── STUDIO triggers ────────────────────────────────────────────────────────
  {
    id: 'studio_heavy_exporter',
    target_plan: 'studio',
    trigger_type: 'usage',
    confidence: 90,
    reason: 'You have exported 20+ professional documents — Studio removes all limits and adds white-label branding.',
    match: (s) => s.export_count >= 20,
  },
  {
    id: 'studio_power_user',
    target_plan: 'studio',
    trigger_type: 'revenue_opportunity',
    confidence: 85,
    reason: 'You return to Corvioz frequently — Studio is built for users running client operations at scale.',
    match: (s) => s.return_user_frequency > 5,
  },

  // ── GROWTH triggers ────────────────────────────────────────────────────────
  {
    id: 'growth_invoice_volume',
    target_plan: 'growth',
    trigger_type: 'usage',
    confidence: 88,
    reason: 'You have created 10+ invoices — Growth unlocks batch invoicing, automated reminders, and workflow automation.',
    match: (s) => s.invoice_count >= 10,
  },
  {
    id: 'growth_quote_volume',
    target_plan: 'growth',
    trigger_type: 'usage',
    confidence: 80,
    reason: 'You have submitted 5+ quotes — Growth adds advanced client tracking and follow-up automation.',
    match: (s) => s.quote_count >= 5,
  },
  {
    id: 'growth_intent_high_engagement',
    target_plan: 'growth',
    trigger_type: 'intent',
    confidence: 72,
    reason: 'You have visited pricing multiple times — Growth is the step up for freelancers scaling their practice.',
    match: (s) => s.pricing_view_count >= 3 && s.invoice_count >= 5,
  },

  // ── PRO triggers ───────────────────────────────────────────────────────────
  {
    id: 'pro_invoice_limit_hit',
    target_plan: 'pro',
    trigger_type: 'usage',
    confidence: 95,
    reason: 'You have reached the free invoice limit (3). Pro gives you unlimited invoices and a clean PDF export.',
    match: (s) => s.invoice_count >= 3 && !isPaidPlan(s.plan),
  },
  {
    id: 'pro_first_export_attempt',
    target_plan: 'pro',
    trigger_type: 'usage',
    confidence: 85,
    reason: 'PDF export is a Pro feature. Upgrade to remove the watermark and send professional invoices.',
    match: (s) => s.export_count >= 1 && !isPaidPlan(s.plan),
  },
  {
    id: 'pro_pricing_page_intent',
    target_plan: 'pro',
    trigger_type: 'intent',
    confidence: 65,
    reason: 'You have been exploring pricing. Pro is the most popular plan for solo freelancers.',
    match: (s) => s.pricing_view_count >= 2 && !isPaidPlan(s.plan),
  },
  {
    id: 'pro_scroll_depth_intent',
    target_plan: 'pro',
    trigger_type: 'intent',
    confidence: 55,
    reason: 'Looks like you are evaluating your options. Pro is the best fit for active freelancers.',
    match: (s) => s.scroll_depth >= 75 && !isPaidPlan(s.plan),
  },
  {
    id: 'pro_return_user_risk',
    target_plan: 'pro',
    trigger_type: 'risk',
    confidence: 60,
    reason: 'You visit Corvioz regularly but have not upgraded. Unlock the full workflow on Pro.',
    match: (s) => s.return_user_frequency >= 3 && !isPaidPlan(s.plan),
  },
];

// ─── Core Engine ───────────────────────────────────────────────────────────────

/**
 * Evaluate all trigger rules against the provided user signals and return
 * the highest-priority matching upgrade decision.
 *
 * - Returns `should_show_upgrade: false` for users already on the right plan.
 * - Emits `upgrade_trigger_fired` analytics event when a trigger fires.
 * - Pure function: no async, no network calls.
 */
export function getUpgradeDecision(
  signals: UserSignals,
  options: {
    /** Suppress analytics emission (useful in SSR or tests) */
    suppressTracking?: boolean;
  } = {},
): UpgradeDecision {
  // Already on the top plan — never show upgrade
  if (signals.plan === 'studio' || signals.plan === 'agency') {
    return {
      should_show_upgrade: false,
      target_plan: null,
      reason: '',
      confidence: 0,
      trigger_type: 'usage',
    };
  }

  const segment = getUserSegment(signals);

  // 1. Get base thresholds from runtimeConfig or default static ones
  const baseInvoicePro = runtimeConfig?.thresholds?.pro_invoice_count ?? 3;
  const baseExportPro = runtimeConfig?.thresholds?.pro_export_count ?? 1;
  const baseInvoiceGrowth = runtimeConfig?.thresholds?.growth_invoice_count ?? 10;
  const baseQuoteGrowth = runtimeConfig?.thresholds?.growth_quote_count ?? 5;
  const baseExportStudio = runtimeConfig?.thresholds?.studio_export_count ?? 20;
  const baseReturnStudio = runtimeConfig?.thresholds?.studio_return_frequency ?? 5;

  // 2. Apply segment overrides
  const segmentOverrides = getSegmentThresholdOverrides(segment, {
    pro_invoice_count: baseInvoicePro,
    pro_export_count: baseExportPro,
  });

  const finalInvoicePro = segmentOverrides.pro_invoice_count ?? baseInvoicePro;
  const finalExportPro = segmentOverrides.pro_export_count ?? baseExportPro;
  const finalInvoiceGrowth = baseInvoiceGrowth;
  const finalQuoteGrowth = baseQuoteGrowth;
  const finalExportStudio = baseExportStudio;
  const finalReturnStudio = baseReturnStudio;

  // Evaluate rules in priority order — first match wins (deterministic fallback)
  for (const rule of TRIGGER_RULES) {
    // Skip rules targeting plans the user already has or exceeds
    if (rule.target_plan === 'pro' && isPaidPlan(signals.plan)) continue;
    if (rule.target_plan === 'growth' && (signals.plan === 'growth' || signals.plan === 'studio' || signals.plan === 'agency')) continue;

    let isMatch = false;
    if (rule.id === 'studio_heavy_exporter') {
      isMatch = signals.export_count >= finalExportStudio;
    } else if (rule.id === 'studio_power_user') {
      isMatch = signals.return_user_frequency > finalReturnStudio;
    } else if (rule.id === 'growth_invoice_volume') {
      isMatch = signals.invoice_count >= finalInvoiceGrowth;
    } else if (rule.id === 'growth_quote_volume') {
      isMatch = signals.quote_count >= finalQuoteGrowth;
    } else if (rule.id === 'pro_invoice_limit_hit') {
      isMatch = signals.invoice_count >= finalInvoicePro && !isPaidPlan(signals.plan);
    } else if (rule.id === 'pro_first_export_attempt') {
      isMatch = signals.export_count >= finalExportPro && !isPaidPlan(signals.plan);
    } else {
      isMatch = rule.match(signals);
    }

    if (isMatch) {
      const decision: UpgradeDecision = {
        should_show_upgrade: true,
        target_plan: rule.target_plan,
        reason: rule.reason,
        confidence: rule.confidence,
        trigger_type: rule.trigger_type,
      };

      if (!options.suppressTracking) {
        trackUpgradeTriggerEvent(decision, signals.plan, rule.id);
      }

      return decision;
    }
  }

  // No rule matched — no upgrade prompt needed
  return {
    should_show_upgrade: false,
    target_plan: null,
    reason: '',
    confidence: 0,
    trigger_type: 'usage',
  };
}

// ─── Analytics Emission ────────────────────────────────────────────────────────

function trackUpgradeTriggerEvent(
  decision: UpgradeDecision,
  currentPlan: string,
  ruleId: string,
): void {
  try {
    trackEvent('upgrade_trigger_fired', {
      plan: currentPlan,
      trigger_type: decision.trigger_type,
      confidence: decision.confidence,
      target_plan: decision.target_plan,
      rule_id: ruleId,
    });
  } catch {
    // Never let analytics failures break the engine
  }
}

// ─── Signal Helpers ────────────────────────────────────────────────────────────

/**
 * Read user signals from browser localStorage / sessionStorage.
 * Safe to call from any client component — returns zero-value defaults
 * when storage is unavailable (SSR).
 */
export function readSignalsFromStorage(plan: string, isAuthenticated: boolean): UserSignals {
  if (typeof window === 'undefined') {
    return {
      invoice_count: 0,
      quote_count: 0,
      export_count: 0,
      pricing_view_count: 0,
      scroll_depth: 0,
      return_user_frequency: 0,
      is_authenticated: isAuthenticated,
      plan,
    };
  }

  let invoice_count = 0;
  let quote_count = 0;

  try {
    const statsRaw = window.localStorage.getItem('corvioz_usage_stats');
    if (statsRaw) {
      const stats = JSON.parse(statsRaw);
      invoice_count = Number(stats.invoicesCount || 0);
      quote_count = Number(stats.quotesCount || 0);
    }
  } catch { /* ignore parse errors */ }

  return {
    invoice_count,
    quote_count,
    export_count: Number(window.localStorage.getItem('corvioz_export_count') || 0),
    pricing_view_count: Number(window.sessionStorage.getItem('corvioz_revenue_pricing_view_count') || 0),
    scroll_depth: 0, // set by caller after scroll tracking
    return_user_frequency: Number(window.localStorage.getItem('corvioz_free_dashboard_views') || 0),
    is_authenticated: isAuthenticated,
    plan,
  };
}

/**
 * One-liner convenience: read signals from storage + evaluate in a single call.
 * Used by React hooks and the pricing page.
 */
export function evaluateFromStorage(plan: string, isAuthenticated: boolean): UpgradeDecision {
  const signals = readSignalsFromStorage(plan, isAuthenticated);
  return getUpgradeDecision(signals);
}
