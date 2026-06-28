import { normalizeGA4EventName, type GA4EventPayload } from '../analytics/ga4-event-bridge';

export type ValidRevenueAction = 'allow' | 'block' | 'upsell' | 'soft_paywall' | 'redirect';
export type ValidRevenueRiskLevel = 'low' | 'medium' | 'high';

export type RevenueDecisionSchema = {
  decision_id: string;
  action: ValidRevenueAction;
  shadow_action?: ValidRevenueAction;
  reason: string;
  reason_chain?: string[];
  risk_level: ValidRevenueRiskLevel;
  intent_score: number;
  intent_contribution_score?: number;
  pricing_trigger_attribution?: {
    triggered: boolean;
    trigger: string;
    pricing_viewed: boolean;
    pricing_view_count: number;
    pricing_change: number;
  };
  explanation?: {
    summary: string;
    factors: string[];
    intent_score: number;
  };
  revenue_signal_score?: number;
  funnel_stage?: string;
  upgrade_recommendation?: string;
  upgrade_target?: string;
  guest_mode_user?: boolean;
  activated_user?: boolean;
  first_value_timestamp?: number;
  pricing_intent_score?: number;
  trust_guardrail?: {
    value_first: boolean;
    protected_value_action: boolean;
    prompt_allowed: boolean;
    prompt_policy: string;
    educational_message: string;
    free_included: string[];
    paid_required: string[];
  };
  psychology?: {
    enabled: boolean;
    trigger: string;
    paywall_reason: string;
    why_am_i_seeing_this: string;
    what_unlocks_after_upgrade: string[];
    friction_mode: string;
    pricing_hint?: string;
    urgency_hint?: string;
    usage_based_suggestion?: string;
    most_users_upgrade_hint?: string;
  };
  paywall_trigger_map?: Record<string, boolean>;
  ga4_event?: GA4EventPayload | null;
};

const VALID_ACTIONS = new Set<ValidRevenueAction>(['allow', 'block', 'upsell', 'soft_paywall', 'redirect']);
const VALID_RISK_LEVELS = new Set<ValidRevenueRiskLevel>(['low', 'medium', 'high']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clampIntentScore(value: unknown) {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}

function fallbackDecision(reason = 'fallback_safe_mode'): RevenueDecisionSchema {
  return {
    decision_id: `fallback_${Date.now()}`,
    action: 'allow',
    reason,
    reason_chain: [reason],
    risk_level: 'low',
    intent_score: 0,
    intent_contribution_score: 0,
    pricing_trigger_attribution: {
      triggered: false,
      trigger: 'fallback_safe_mode',
      pricing_viewed: false,
      pricing_view_count: 0,
      pricing_change: 0,
    },
    explanation: {
      summary: 'Safe fallback decision applied',
      factors: [reason],
      intent_score: 0,
    },
    revenue_signal_score: 0,
    funnel_stage: 'fallback_safe_mode',
    upgrade_recommendation: 'none',
    guest_mode_user: false,
    activated_user: false,
    pricing_intent_score: 0,
    trust_guardrail: {
      value_first: true,
      protected_value_action: false,
      prompt_allowed: true,
      prompt_policy: 'fallback_safe_mode',
      educational_message: 'Safe mode allowed the action to avoid hurting usability.',
      free_included: ['Create your first invoice', 'Create your first quote'],
      paid_required: ['Export PDF', 'Send invoices', 'Save work permanently'],
    },
  };
}

function isRiskConsistent(action: ValidRevenueAction, riskLevel: ValidRevenueRiskLevel) {
  if (action === 'block') return riskLevel === 'high';
  if (action === 'soft_paywall' || action === 'redirect' || action === 'upsell') return riskLevel === 'medium' || riskLevel === 'high';
  return riskLevel === 'low' || riskLevel === 'medium';
}

export function validateRevenueDecision(decision: Partial<RevenueDecisionSchema> = {}): RevenueDecisionSchema {
  const action = decision.action;
  const riskLevel = decision.risk_level;
  const intentScore = clampIntentScore(decision.intent_score);
  const intentContributionScore = clampIntentScore(decision.intent_contribution_score ?? intentScore);
  const decisionId = String(decision.decision_id || '').trim();
  const reason = String(decision.reason || '').trim();
  const reasonChain = Array.isArray(decision.reason_chain)
    ? decision.reason_chain.map((entry) => String(entry || '').trim()).filter(Boolean)
    : [];
  const pricingAttribution = decision.pricing_trigger_attribution;
  const explanation = decision.explanation;
  const revenueSignalScore = clampIntentScore(decision.revenue_signal_score ?? intentScore);
  const pricingIntentScore = clampIntentScore(decision.pricing_intent_score ?? intentScore);
  const trustGuardrail = decision.trust_guardrail;
  const psychology = decision.psychology;
  const paywallTriggerMap = decision.paywall_trigger_map;
  const ga4Event = decision.ga4_event;
  const ga4EventName = normalizeGA4EventName(ga4Event?.event_name);

  if (!decisionId || !action || !VALID_ACTIONS.has(action)) {
    return fallbackDecision();
  }

  if (!riskLevel || !VALID_RISK_LEVELS.has(riskLevel)) {
    return fallbackDecision();
  }

  if (!Number.isFinite(Number(decision.intent_score)) || intentScore < 0 || intentScore > 100) {
    return fallbackDecision();
  }

  if (!Number.isFinite(Number(decision.intent_contribution_score ?? intentScore))) {
    return fallbackDecision();
  }

  if (!isRiskConsistent(action, riskLevel)) {
    return fallbackDecision();
  }

  return {
    decision_id: decisionId,
    action,
    ...(decision.shadow_action && VALID_ACTIONS.has(decision.shadow_action) ? { shadow_action: decision.shadow_action } : {}),
    reason: reason || 'validated_revenue_decision',
    reason_chain: reasonChain.length > 0 ? reasonChain : [reason || 'validated_revenue_decision'],
    risk_level: riskLevel,
    intent_score: intentScore,
    intent_contribution_score: intentContributionScore,
    pricing_trigger_attribution: {
      triggered: Boolean(pricingAttribution?.triggered),
      trigger: String(pricingAttribution?.trigger || 'none'),
      pricing_viewed: Boolean(pricingAttribution?.pricing_viewed),
      pricing_view_count: Math.max(0, Math.floor(toNumber(pricingAttribution?.pricing_view_count, 0))),
      pricing_change: toNumber(pricingAttribution?.pricing_change, 0),
    },
    explanation: {
      summary: String(explanation?.summary || reason || 'Revenue decision evaluated'),
      factors: Array.isArray(explanation?.factors)
        ? explanation.factors.map((factor) => String(factor || '').trim()).filter(Boolean).slice(0, 5)
        : reasonChain.slice(0, 5),
      intent_score: intentScore,
    },
    revenue_signal_score: revenueSignalScore,
    funnel_stage: String(decision.funnel_stage || 'unknown'),
    upgrade_recommendation: String(decision.upgrade_recommendation || 'none'),
    ...(decision.upgrade_target ? { upgrade_target: String(decision.upgrade_target) } : {}),
    guest_mode_user: Boolean(decision.guest_mode_user),
    activated_user: Boolean(decision.activated_user),
    ...(Number.isFinite(Number(decision.first_value_timestamp))
      ? { first_value_timestamp: Math.max(0, toNumber(decision.first_value_timestamp, 0)) }
      : {}),
    pricing_intent_score: pricingIntentScore,
    trust_guardrail: {
      value_first: Boolean(trustGuardrail?.value_first ?? true),
      protected_value_action: Boolean(trustGuardrail?.protected_value_action),
      prompt_allowed: Boolean(trustGuardrail?.prompt_allowed ?? true),
      prompt_policy: String(trustGuardrail?.prompt_policy || 'value_first_default'),
      educational_message: String(trustGuardrail?.educational_message || 'Corvioz shows paid options only after users experience value.'),
      free_included: Array.isArray(trustGuardrail?.free_included)
        ? trustGuardrail.free_included.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : ['Create your first invoice', 'Create your first quote'],
      paid_required: Array.isArray(trustGuardrail?.paid_required)
        ? trustGuardrail.paid_required.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : ['Export PDF', 'Send invoices', 'Save work permanently'],
    },
    psychology: {
      enabled: Boolean(psychology?.enabled),
      trigger: String(psychology?.trigger || 'none'),
      paywall_reason: String(psychology?.paywall_reason || 'No monetization prompt'),
      why_am_i_seeing_this: String(psychology?.why_am_i_seeing_this || 'No monetization psychology trigger matched this action.'),
      what_unlocks_after_upgrade: Array.isArray(psychology?.what_unlocks_after_upgrade)
        ? psychology.what_unlocks_after_upgrade.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
        : ['Professional Invoice Delivery', 'Send invoices and quotes to clients', 'Save work permanently'],
      friction_mode: String(psychology?.friction_mode || 'none'),
      ...(psychology?.pricing_hint ? { pricing_hint: String(psychology.pricing_hint) } : {}),
      ...(psychology?.urgency_hint ? { urgency_hint: String(psychology.urgency_hint) } : {}),
      ...(psychology?.usage_based_suggestion ? { usage_based_suggestion: String(psychology.usage_based_suggestion) } : {}),
      ...(psychology?.most_users_upgrade_hint ? { most_users_upgrade_hint: String(psychology.most_users_upgrade_hint) } : {}),
    },
    paywall_trigger_map: paywallTriggerMap && typeof paywallTriggerMap === 'object'
      ? Object.fromEntries(Object.entries(paywallTriggerMap).map(([key, value]) => [key, Boolean(value)]))
      : {},
    ga4_event: ga4Event && typeof ga4Event === 'object' && ga4EventName
      ? {
          event_name: ga4EventName,
          user_id: String(ga4Event.user_id || 'anonymous'),
          intent_score: clampIntentScore(ga4Event.intent_score),
          funnel_step: String(ga4Event.funnel_step || ''),
          action: VALID_ACTIONS.has(ga4Event.action) ? ga4Event.action : action,
          metadata: ga4Event.metadata && typeof ga4Event.metadata === 'object' ? ga4Event.metadata : {},
        }
      : null,
  };
}
