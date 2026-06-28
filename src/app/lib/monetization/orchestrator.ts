import { getMonetizationPricing, type MonetizationPricingTier } from './dynamic-pricing';
import { evaluateUpgradeTrigger, type MonetizationAction } from './upgrade-trigger';
import { computeUserValueScore, type UserValueSignals, type UserValueScore } from './user-value-engine';

export type MonetizationOrchestratorInput = UserValueSignals & {
  action_type?: 'invoice_create' | 'quote_create' | 'export_pdf' | 'pricing_view' | string;
  user_state?: 'free' | 'logged_in' | 'paid' | string;
};

export type MonetizationDecision = {
  final_action: string;
  pricing_tier: string;
  ui_behavior: string;
  reason: string;
};

export type MonetizationOrchestratorResult = MonetizationDecision & {
  scores: UserValueScore;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function uiBehaviorFor(action: MonetizationAction, pricingTier: MonetizationPricingTier, score: UserValueScore) {
  if (action === 'block') return 'show_upgrade_required';
  if (action === 'redirect') return 'redirect_to_pricing';
  if (action === 'upsell') return pricingTier === 'premium' ? 'show_pro_upgrade_modal' : 'show_upgrade_modal';
  if (pricingTier === 'premium') return 'show_pro_pricing_first';
  if (pricingTier === 'low' && score.risk_score >= 50) return 'restrict_low_value_usage';
  if (pricingTier === 'low') return 'delay_paywall';
  return 'allow_standard_flow';
}

export function evaluateAutonomousMonetization(input: MonetizationOrchestratorInput = {}): MonetizationOrchestratorResult {
  const scores = computeUserValueScore(input);
  const pricing = getMonetizationPricing(scores);
  const upgrade = evaluateUpgradeTrigger({
    action_type: input.action_type,
    invoice_create_count: input.invoice_created_count,
    pricing_view_count: input.pricing_page_visits,
    intent_score: scores.intent_score,
    user_state: input.user_state,
  });

  const lowValueAbuseRisk = scores.risk_score > 70;
  const finalAction = lowValueAbuseRisk ? 'block' : upgrade.action;
  const uiBehavior = lowValueAbuseRisk
    ? 'restrict_low_value_usage'
    : uiBehaviorFor(upgrade.action, pricing.price_tier, scores);

  const exportActions = Math.max(0, toNumber(input.export_actions, 0));
  const reasonParts = [
    upgrade.upgrade_reason,
    pricing.reason,
    `intent=${scores.intent_score}`,
    `value=${scores.value_score}`,
    `risk=${scores.risk_score}`,
    exportActions > 0 ? `exports=${exportActions}` : '',
  ].filter(Boolean);

  return {
    final_action: finalAction,
    pricing_tier: pricing.price_tier,
    ui_behavior: uiBehavior,
    reason: reasonParts.join(' '),
    scores,
  };
}
