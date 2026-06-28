import { detectMisclassification } from './misclassification-detector';
import { evaluatePaywallSafety } from './paywall-safety-guard';
import { detectRevenueDrift, type RevenueDriftInput } from './revenue-drift-detector';

export type ValidationRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ValidationEngineInput = RevenueDriftInput & {
  intent_score?: number;
  value_score?: number;
  funnel_step?: string;
  action_type?: string;
  recommended_action?: string;
  pricing_action?: string;
  paywall_action?: string;
  invoice_create_count?: number;
  paywall_count_this_session?: number;
  export_attempt_count?: number;
};

export type ValidationEngineResult = {
  approved: boolean;
  risk_level: ValidationRiskLevel;
  adjusted_action?: string;
  reason: string;
};

const BLOCKING_ACTIONS = new Set(['block', 'paywall', 'hard_paywall']);
const SIGNUP_STEPS = new Set(['signup_start', 'signup_complete', 'signup', 'auth', 'registration']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clampScore(value: unknown) {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function isBlocking(action: unknown) {
  return BLOCKING_ACTIONS.has(normalize(action));
}

function maxRisk(current: ValidationRiskLevel, next: ValidationRiskLevel): ValidationRiskLevel {
  const order: Record<ValidationRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  return order[next] > order[current] ? next : current;
}

export function validateRevenueAction(input: ValidationEngineInput = {}): ValidationEngineResult {
  const intentScore = clampScore(input.intent_score);
  const valueScore = clampScore(input.value_score);
  const funnelStep = normalize(input.funnel_step);
  const actionType = normalize(input.action_type);
  const recommendedAction = normalize(input.recommended_action);
  const paywallAction = normalize(input.paywall_action || input.recommended_action);
  const pricingAction = normalize(input.pricing_action);
  const reasons: string[] = [];
  let riskLevel: ValidationRiskLevel = 'low';
  let adjustedAction: string | undefined;

  const paywallSafety = evaluatePaywallSafety({
    funnel_step: input.funnel_step,
    action_type: input.action_type,
    recommended_action: input.recommended_action,
    paywall_action: input.paywall_action,
    intent_score: intentScore,
    invoice_create_count: input.invoice_create_count,
    paywall_count_this_session: input.paywall_count_this_session,
  });

  if (!paywallSafety.allowed) {
    adjustedAction = paywallSafety.softened_action;
    riskLevel = maxRisk(riskLevel, adjustedAction === 'allow' ? 'critical' : 'high');
    reasons.push(paywallSafety.reason);
  }

  if (SIGNUP_STEPS.has(funnelStep) && isBlocking(recommendedAction)) {
    adjustedAction = 'allow';
    riskLevel = maxRisk(riskLevel, 'critical');
    reasons.push('Signup monetization block detected.');
  }

  if (intentScore < 30 && (paywallAction === 'paywall' || paywallAction === 'hard_paywall')) {
    adjustedAction = 'upsell';
    riskLevel = maxRisk(riskLevel, 'high');
    reasons.push('Cold user hard paywall would harm activation.');
  }

  if ((intentScore >= 70 || valueScore >= 70) && isBlocking(recommendedAction) && !actionType.includes('export')) {
    adjustedAction = 'upsell';
    riskLevel = maxRisk(riskLevel, 'high');
    reasons.push('High-value user is being blocked outside a hard monetization moment.');
  }

  if (intentScore <= 30 && valueScore <= 35 && (pricingAction.includes('premium') || pricingAction.includes('pro'))) {
    adjustedAction = adjustedAction || 'allow';
    riskLevel = maxRisk(riskLevel, 'medium');
    reasons.push('Low-intent user is receiving premium pricing treatment too early.');
  }

  const misclassification = detectMisclassification({
    intent_score: intentScore,
    value_score: valueScore,
    funnel_step: input.funnel_step,
    action_type: input.action_type,
    recommended_action: input.recommended_action,
    pricing_action: input.pricing_action,
    paywall_action: input.paywall_action,
    export_attempt_count: input.export_attempt_count,
  });

  if (misclassification.false_positive_rate >= 0.5) {
    riskLevel = maxRisk(riskLevel, 'medium');
    reasons.push(...misclassification.warning);
  }

  const drift = detectRevenueDrift(input);
  if (drift.drift_detected) {
    riskLevel = maxRisk(riskLevel, drift.impact_level === 'critical' ? 'critical' : drift.impact_level === 'high' ? 'high' : 'medium');
    adjustedAction = adjustedAction || (drift.impact_level === 'critical' ? 'rollback' : 'upsell');
    reasons.push(drift.recommendation);
  }

  const approved = riskLevel === 'low' || riskLevel === 'medium';
  return {
    approved,
    risk_level: riskLevel,
    ...(adjustedAction ? { adjusted_action: adjustedAction } : {}),
    reason: reasons.length > 0 ? Array.from(new Set(reasons)).join(' ') : 'Revenue action passed validation safety checks.',
  };
}
