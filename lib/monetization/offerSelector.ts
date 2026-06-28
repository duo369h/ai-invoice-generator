/**
 * Offer Selector — Corvioz v2
 *
 * Takes upgrade decisions, calculated scores, and page context to determine
 * the optimal offer type and copywriting.
 *
 * Offer Types:
 *   - soft_banner: Non-intrusive notification banner
 *   - modal: High-visibility modal overlay
 *   - checkout_nudge: Inline or floating call-to-action near action zones
 *   - unlock: Special 7-day feature unlock for high churn risk users
 */

import { UpgradeDecision } from './upgradeTriggerEngine';
import { ScoringOutput } from './upgradeScoringEngine';

export interface OfferResult {
  message: string;
  cta_text: string;
  offer_type: 'soft_banner' | 'modal' | 'checkout_nudge' | 'unlock';
}

export function selectOffer(
  decision: UpgradeDecision,
  scores: ScoringOutput,
  pageContext: string
): OfferResult {
  const targetPlan = decision.target_plan || 'pro';
  const planCapitalized = targetPlan === 'pro' ? 'Pro' : targetPlan === 'growth' ? 'Growth' : 'Studio';

  // 1. High Churn Risk -> Offer Trial/Unlock
  if (scores.churn_risk > 70 && decision.should_show_upgrade) {
    return {
      message: `Unlock all ${planCapitalized} features for 7 days free to streamline your billing. No card required.`,
      cta_text: `Activate 7-Day Free ${planCapitalized}`,
      offer_type: 'unlock',
    };
  }

  // 2. Export context specific
  if (pageContext === 'export') {
    return {
      message: `Remove the watermark from your PDF exports and present a professional image to clients by upgrading to ${planCapitalized}.`,
      cta_text: `Upgrade to ${planCapitalized} (Watermark Free)`,
      offer_type: 'checkout_nudge',
    };
  }

  // 3. Invoice creation success context specific
  if (pageContext === 'invoice_success') {
    if (targetPlan === 'growth') {
      return {
        message: "Invoice created! You are scaling fast. Upgrade to Growth to unlock automated payment reminders and portal tracking.",
        cta_text: "Upgrade to Growth",
        offer_type: 'checkout_nudge',
      };
    }
    return {
      message: `Invoice created successfully! Remove all watermarks and get unlimited invoices on ${planCapitalized}.`,
      cta_text: `Upgrade to ${planCapitalized}`,
      offer_type: 'soft_banner',
    };
  }

  // 4. High Confidence or high revenue potential -> Modal upsell
  if (decision.confidence > 80 && decision.should_show_upgrade) {
    return {
      message: decision.reason || `You're ready for the next level. Upgrade to ${planCapitalized} to remove limit constraints.`,
      cta_text: `Upgrade to ${planCapitalized} Now`,
      offer_type: 'modal',
    };
  }

  // 5. Default/Fallback: soft banner
  return {
    message: decision.reason || `${planCapitalized} is recommended for your current freelancing workload.`,
    cta_text: `Explore ${planCapitalized} Features`,
    offer_type: 'soft_banner',
  };
}
