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

import { getUnifiedDecision } from '../execution/unifiedDecisionEngine';
import { translateDecision } from '../execution/uiTranslator';

export interface PricingCardViewModel {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  badgeText: string | null;
  features: string[];
  isCurrent: boolean;
  ctaLabel: string;
  highlightedPlan: 'pro' | 'growth' | 'studio' | null;
  badge: 'RECOMMENDED' | null;
  ctaState: 'normal' | 'emphasized' | 'disabled';
  visualIntensity: number;
  reason: string;
  outcome: string;
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
    targetPlan: 'pro' | 'growth' | 'studio' | null;
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

  const cards = plans.map((plan) => {
    const isFree = plan.id === 'free';
    const isPro = plan.id === 'pro';
    const isGrowth = plan.id === 'growth';
    const isStudio = plan.id === 'studio' || plan.id === 'agency';

    // Determine current plan display status
    const isCurrent = isAuthenticated && !subLoading &&
      (userPlan === plan.id || (plan.id === 'studio' && userPlan === 'agency'));

    const isHighlighted = plan.id === ui.highlightPlan;
    const badgeText = isHighlighted ? 'RECOMMENDED FOR YOU' : (plan.badge_text || null);

    let name = plan.name || plan.id;
    let description = plan.description || '';
    let features: string[] = [];
    let outcome = '';
    let identity = '';

    if (isFree) {
      name = plan.name || 'Free';
      identity = 'Try';
      description = 'Spend less time on admin and start pitching projects.';
      outcome = 'Spend less time on admin and start pitching projects.';
      features = [
        'Pitch custom estimates & quotes',
        'Share your professional Bento card',
        'Export watermarked proposal documents',
      ];
    } else if (isPro) {
      name = plan.name || 'Starter';
      identity = 'Starter';
      description = 'Get paid faster';
      outcome = 'Get paid faster';
      features = [
        'Collect credit card or bank transfers instantly',
        'Avoid billing delays with professional templates',
        'Auto-fill client details on future documents',
      ];
    } else if (isGrowth) {
      name = plan.name || 'Pro';
      identity = 'Pro';
      description = 'Never miss a payment';
      outcome = 'Never miss a payment';
      features = [
        'Automate follow-ups on late payments',
        'Build custom client portfolios to win repeat work',
        'Qualify and capture prospective client inquiries',
      ];
    } else if (isStudio) {
      name = plan.name || 'Studio';
      identity = 'Agency';
      description = 'Scale client operations';
      outcome = 'Scale client operations';
      features = [
        'Brand client workspaces under your custom domain',
        'Qualify inbound inquiries with budget filters',
        'Present specialist team members to secure larger contracts',
      ];
    }

    // Compute CTA button labels deterministically (TASK 4 outcome alignment)
    let ctaLabel = '';
    if (isCurrent) {
      ctaLabel = '✓ Current Plan';
    } else if (isFree) {
      ctaLabel = 'Start Free';
    } else if (isPro || isGrowth) {
      ctaLabel = 'Upgrade';
    } else {
      ctaLabel = 'Join Waitlist';
    }

    return {
      id: plan.id,
      name,
      priceMonthly: plan.price_monthly,
      priceYearly: plan.price_yearly,
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
