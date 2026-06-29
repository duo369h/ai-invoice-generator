// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

/**
 * Pricing View Model — Corvioz v8.5 Decision Unification Layer
 *
 * Prepares and transforms pricing plans and engine decisions into flat view states.
 * Consumes the unifiedDecisionEngine and uiTranslator as a pure renderer wrapper.
 */

import { getUnifiedDecision } from 'lib/execution/unifiedDecisionEngine';
import { translateDecision } from 'lib/execution/uiTranslator';

export interface PricingCardViewModel {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
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
 * Generates the view model for the pricing page.
 */
export function getPricingViewModel(input: PricingViewModelInput): PricingViewModelOutput {
  const { plans, session, userPlan, isAuthenticated, subLoading } = input;
  const userId = session?.user?.id || null;

  // Retrieve unified decision & translated UI signals
  const decision = getUnifiedDecision(userId);
  const ui = translateDecision(decision);

  const STRICT_PLAN_IDS = ['free', 'starter', 'pro', 'studio'];
  const uniquePlansMap = new Map<string, any>();
  plans.forEach((plan) => {
    if (plan && plan.id && STRICT_PLAN_IDS.includes(plan.id) && !uniquePlansMap.has(plan.id)) {
      uniquePlansMap.set(plan.id, plan);
    }
  });

  const orderedPlans = STRICT_PLAN_IDS
    .map((id) => uniquePlansMap.get(id))
    .filter(Boolean);

  const cards = orderedPlans.map((plan) => {
    const isFree = plan.id === 'free';
    const isStarter = plan.id === 'starter';
    const isPro = plan.id === 'pro';
    const isStudio = plan.id === 'studio';

    // Determine current plan display status
    const isCurrent = isAuthenticated && !subLoading && userPlan === plan.id;

    const isHighlighted = plan.id === ui.highlightPlan;
    const badgeText = isHighlighted ? 'RECOMMENDED FOR YOU' : (plan.badge_text || null);

    // Enforce 1:1 mapping: free -> Free, starter -> $9, pro -> $19, studio -> Coming Soon
    let name = '';
    let priceMonthly = 0;
    let priceYearly = 0;
    let identity = '';
    let ctaLabel = '';

    if (isFree) {
      name = 'Free';
      priceMonthly = 0;
      priceYearly = 0;
      identity = 'Free';
      ctaLabel = isCurrent ? '✓ Current Plan' : 'Start Free';
    } else if (isStarter) {
      name = 'Starter';
      priceMonthly = 9;
      priceYearly = 7;
      identity = 'Starter';
      ctaLabel = isCurrent ? '✓ Current Plan' : 'Upgrade';
    } else if (isPro) {
      name = 'Pro';
      priceMonthly = 19;
      priceYearly = 16;
      identity = 'Pro';
      ctaLabel = isCurrent ? '✓ Current Plan' : 'Upgrade';
    } else if (isStudio) {
      name = 'Studio';
      priceMonthly = 0;
      priceYearly = 0;
      identity = 'Studio';
      ctaLabel = isCurrent ? '✓ Current Plan' : 'Join Waitlist';
    } else {
      name = plan.name || plan.id;
      priceMonthly = Number(plan.price_monthly || 0);
      priceYearly = Number(plan.price_yearly || 0);
      identity = plan.id;
      ctaLabel = isCurrent ? '✓ Current Plan' : 'Select Plan';
    }

    const features: string[] = Array.isArray(plan.features) ? plan.features : [];
    const outcome = plan.description || '';

    return {
      id: plan.id,
      name,
      priceMonthly,
      priceYearly,
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

  return {
    cards,
    upgradeBanner,
  };
}
