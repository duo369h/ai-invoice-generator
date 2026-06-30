import { recordDecisionTelemetry } from '../../../core/telemetry/decisionTelemetry';

export type RevenueAction =
  | 'allow'
  | 'block'
  | 'upsell'
  | 'redirect'
  | 'paywall';

export type RevenueActionType =
  | 'create_invoice'
  | 'create_quote'
  | 'export_pdf'
  | 'quote_export'
  | 'pricing_view'
  | 'pricing_exit'
  | string;

export type RevenueUserState = 'free' | 'logged_in' | 'paid' | string;

export type RevenueSessionState = {
  intent?: 'invoice' | 'quote' | 'explore' | 'pricing' | string;
  pricing_view_count?: number;
  pricing_exit_count?: number;
  export_attempt_count?: number;
  last_funnel_step?: string;
  [key: string]: unknown;
};

export type RevenueUsageCount = {
  invoice_create_count?: number;
  quote_create_count?: number;
  quote_export_count?: number;
  export_pdf_count?: number;
  pricing_view_count?: number;
  [key: string]: unknown;
};

export type RevenueDecisionInput = {
  funnel_step?: string;
  action_type?: RevenueActionType;
  intent_score?: number;
  session_state?: RevenueSessionState;
  user_state?: RevenueUserState;
  usage_count?: RevenueUsageCount;
};

export type RevenueDecision = {
  action: RevenueAction;
  reason: string;
  trigger: string;
  recommended_plan?: string;
};

const PAID_STATES = new Set(['paid', 'pro', 'professional', 'agency']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clampIntentScore(value: unknown) {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}

function isPaid(userState?: RevenueUserState) {
  return PAID_STATES.has(String(userState || '').toLowerCase());
}

function count(input: RevenueDecisionInput, key: keyof RevenueUsageCount) {
  return toNumber(input.usage_count?.[key], 0);
}

function sessionCount(input: RevenueDecisionInput, key: keyof RevenueSessionState) {
  return toNumber(input.session_state?.[key], 0);
}

function decision(action: RevenueAction, reason: string, trigger: string, recommended_plan?: string): RevenueDecision {
  return {
    action,
    reason,
    trigger,
    ...(recommended_plan ? { recommended_plan } : {}),
  };
}

function observedDecision(input: RevenueDecisionInput, result: RevenueDecision): RevenueDecision {
  recordDecisionTelemetry({
    source: 'src/app/lib/revenue/revenue-decision-engine.ts:evaluateRevenueDecision',
    decisionType: 'revenue decision',
    legacyOutput: result,
    adapterOutput: {
      delegatedEngine: 'src/app/lib/revenue/revenue-decision-engine.ts',
      input: normalizeRevenueDecisionInput(input),
      output: result,
    },
    tags: ['REVENUE', 'PAYWALL', 'EXPORT_PERMISSION', 'LOG_ONLY', 'v5.2.1'],
  });
  return result;
}

export function evaluateRevenueDecision(input: RevenueDecisionInput): RevenueDecision {
  const actionType = String(input.action_type || '').toLowerCase();
  const funnelStep = String(input.funnel_step || '').toLowerCase();
  const intentScore = clampIntentScore(input.intent_score);

  if (isPaid(input.user_state)) {
    return observedDecision(input, decision('allow', 'Paid user can continue without monetization friction.', 'paid_user_bypass'));
  }

  if (funnelStep === 'pricing_exit' || actionType === 'pricing_exit') {
    return observedDecision(input, decision('upsell', 'User exited pricing before selecting a plan.', 'pricing_exit_discount_modal', 'pro'));
  }

  const isExportAction = actionType === 'export_pdf' || actionType === 'quote_export';
  if (intentScore > 70 && isExportAction) {
    return observedDecision(input, decision('paywall', 'High-intent unpaid export attempts require checkout before value leaves the product.', 'high_intent_export_hard_paywall', 'pro'));
  }

  if (actionType === 'quote_export') {
    return observedDecision(input, decision('block', 'Quote export is a monetization moment for free users.', 'quote_export_lock_pro_upsell', 'pro'));
  }

  if (count(input, 'invoice_create_count') > 2) {
    return observedDecision(input, decision('paywall', 'Free invoice creation limit exceeded.', 'invoice_create_count_upgrade_paywall', 'pro'));
  }

  const pricingViews = Math.max(count(input, 'pricing_view_count'), sessionCount(input, 'pricing_view_count'));
  if (actionType === 'pricing_view' && pricingViews >= 2) {
    return observedDecision(input, decision('upsell', 'Repeated pricing views signal purchase intent and should surface urgency.', 'repeated_pricing_view_urgency_cta', 'pro'));
  }

  if (actionType === 'export_pdf') {
    return observedDecision(input, decision('upsell', 'PDF export is a paid-value action for free users.', 'export_pdf_pro_upsell', 'pro'));
  }

  if (input.user_state === 'free' && intentScore > 60) {
    return observedDecision(input, decision('redirect', 'High-intent free user should be moved toward checkout.', 'high_intent_free_user_pricing_redirect', 'pro'));
  }

  return observedDecision(input, decision('allow', 'No monetization rule matched for this action.', 'no_revenue_rule_matched'));
}

export function normalizeRevenueDecisionInput(input: RevenueDecisionInput = {}): RevenueDecisionInput {
  return {
    funnel_step: String(input.funnel_step || ''),
    action_type: String(input.action_type || ''),
    intent_score: clampIntentScore(input.intent_score),
    session_state: input.session_state && typeof input.session_state === 'object' ? input.session_state : {},
    user_state: String(input.user_state || 'free'),
    usage_count: input.usage_count && typeof input.usage_count === 'object' ? input.usage_count : {},
  };
}
