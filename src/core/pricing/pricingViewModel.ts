// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

/**
 * Pricing View Model — Corvioz v8.5 Decision Unification Layer
 *
 * PURE FUNCTION. No side effects. No business-rule branching.
 * Plans are consumed as-is from the normalization layer upstream.
 * Price values are read structurally — no plan-identity overrides applied here.
 */

import { getUnifiedDecision } from '../execution/unifiedDecisionEngine';
import { translateDecision } from '../execution/uiTranslator';

export interface PricingCardViewModel {
  id: string;
  name: string;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  priceMeta: {
    priceId: string;
  };
  badgeText: string | null;
  features: string[];
  isCurrent: boolean;
  ctaLabel: string;
  highlightedPlan: 'starter' | 'pro' | 'studio' | null;
  badge: 'RECOMMENDED' | null;
  ctaState: 'normal' | 'emphasized' | 'disabled';
  visualIntensity: number;
  reason: string;
  outcome: string;
  identity: string;
}

export interface PricingViewModelInput {
  plans: any[];
  session: any;
  userPlan: string | null | undefined;
  isAuthenticated: boolean;
  subLoading: boolean;
  billingPeriod: 'monthly' | 'yearly';
}

export interface PricingViewModelOutput {
  cards: PricingCardViewModel[];
  upgradeBanner: {
    shouldShowUpgrade: boolean;
    targetPlan: 'starter' | 'pro' | 'studio' | null;
    reason: string;
  } | null;
}

/**
 * Structural price reader — no business meaning.
 * Returns `fallback` only when the raw value is not a finite number.
 */
/** @param {'monthly'|'yearly'} period */
function readPlanPrice(plan, period, fallback) {
  const snakeKey = period === 'monthly' ? 'price_monthly' : 'price_yearly';
  const camelKey = period === 'monthly' ? 'priceMonthly' : 'priceYearly';
  const rawValue = plan?.[snakeKey] ?? plan?.[camelKey] ?? fallback;
  const value = typeof rawValue === 'string'
    ? Number(rawValue.replace(/[$,\s]/g, ''))
    : Number(rawValue);

  return Number.isFinite(value) ? value : fallback;
}

/**
 * getPricingViewModel — deterministic pure function.
 *
 * Same input always produces same output.
 * No per-plan-id price branching. No side effects. No telemetry calls.
 */
export function getPricingViewModel(input: PricingViewModelInput): PricingViewModelOutput {
  const { plans, session, userPlan, isAuthenticated, subLoading, billingPeriod } = input;
  const userId = session?.user?.id || null;

  // Read unified decision + translated UI signals (read-only, no mutations)
  const decision = getUnifiedDecision(userId);
  const ui = translateDecision(decision);

  const STRICT_PLAN_IDS = ['free', 'starter', 'pro', 'studio'];
  const uniquePlansMap = new Map();
  plans.forEach((plan) => {
    if (plan && plan.id && STRICT_PLAN_IDS.includes(plan.id) && !uniquePlansMap.has(plan.id)) {
      uniquePlansMap.set(plan.id, plan);
    }
  });

  const orderedPlans = STRICT_PLAN_IDS
    .map((id) => uniquePlansMap.get(id))
    .filter(Boolean);

  const cards = orderedPlans.map((plan) => {
    const isCurrent     = isAuthenticated && !subLoading && userPlan === plan.id;
    const isHighlighted = plan.id === ui.highlightPlan;
    const badgeText     = isHighlighted ? 'RECOMMENDED FOR YOU' : (plan.badge_text || null);

    // Structural reads only — upstream normalization guarantees finite numbers.
    // No plan-id overrides or business-rule fallback tables here.
    const priceMonthly = readPlanPrice(plan, 'monthly', 0);
    const priceYearly  = readPlanPrice(plan, 'yearly', 0);

    const name     = plan.name || plan.id;
    const identity = plan.name || plan.id;
    const ctaLabel = isCurrent ? '✓ Current Plan' : (plan.id === 'free' ? 'Start Free' : 'Upgrade');
    const features: string[] = Array.isArray(plan.features) && plan.features.length > 0
      ? plan.features
      : [];
    const outcome = plan.description || '';

    // Billing period decision lives here — not in the UI.
    const price = billingPeriod === 'monthly' ? priceMonthly : priceYearly;

    // Checkout priceId decision lives here — not in the controller.
    const priceId = billingPeriod === 'monthly'
      ? (plan.paddle_monthly_price_id || '')
      : (plan.paddle_yearly_price_id || '');

    return {
      id: plan.id,
      name,
      price,
      priceMonthly,
      priceYearly,
      priceMeta: { priceId },
      badgeText,
      features,
      isCurrent,
      ctaLabel,
      highlightedPlan: ui.highlightPlan as any,
      badge: isHighlighted ? ('RECOMMENDED' as const) : null,
      ctaState: isHighlighted ? ('emphasized' as const) : ('normal' as const),
      visualIntensity: decision.confidence,
      reason: decision.reason,
      outcome,
      identity,
    };
  });

  const upgradeBanner = ui.banner !== 'none'
    ? {
        shouldShowUpgrade: true,
        targetPlan: ui.highlightPlan as any,
        reason: decision.reason,
      }
    : null;

  return { cards, upgradeBanner };
}
