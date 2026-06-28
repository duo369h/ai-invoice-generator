/**
 * Funnel Adapter System — Corvioz v3
 *
 * Segments users based on behavior and intent, then dynamically adapts
 * upgrade trigger thresholds, CTA formats, and copywriting strategy.
 */

import { UserSignals, UpgradeDecision } from './upgradeTriggerEngine';
import { OfferResult } from './offerSelector';

export type UserSegment = 'free' | 'power' | 'high_intent';

/**
 * Classify a user into a segment based on behavioral and intent signals
 */
export function getUserSegment(signals: UserSignals): UserSegment {
  const invoiceCount = signals.invoice_count || 0;
  const quoteCount = signals.quote_count || 0;
  const returnFreq = signals.return_user_frequency || 0;
  const pricingViews = signals.pricing_view_count || 0;

  // 1. High Intent Segment: visited pricing pages multiple times or clicked pricing options
  if (
    pricingViews >= 2 || 
    signals.selected_plan || 
    signals.clicked_feature === 'pricing_cta_click' ||
    signals.clicked_feature === 'upgrade_click'
  ) {
    return 'high_intent';
  }

  // 2. Power User Segment: high volume of invoice/quote creation or high usage recurrence
  if (invoiceCount >= 5 || quoteCount >= 3 || returnFreq >= 4) {
    return 'power';
  }

  // 3. Standard Free Segment
  return 'free';
}

/**
 * Dynamically adjust trigger thresholds for a user segment
 */
export function getSegmentThresholdOverrides(
  segment: UserSegment,
  baseThresholds: { pro_invoice_count: number; pro_export_count: number }
): { pro_invoice_count?: number; pro_export_count?: number } {
  if (segment === 'high_intent') {
    // Highly engaged/ready users: trigger slightly earlier (lower threshold by 1)
    return {
      pro_invoice_count: Math.max(1, baseThresholds.pro_invoice_count - 1),
      pro_export_count: Math.max(1, baseThresholds.pro_export_count - 1),
    };
  }

  if (segment === 'power') {
    // Heavy usage but not converted: let them experience slightly more value to convert them
    // Increase pro invoice threshold slightly so they don't block instantly, increasing confidence
    return {
      pro_invoice_count: baseThresholds.pro_invoice_count + 1,
    };
  }

  // Free/new user: standard thresholds
  return {};
}

/**
 * Adapts upgrade copywriting, CTA triggers, and layout formats dynamically based on segment
 */
export function adaptOfferForSegment(
  decision: UpgradeDecision,
  baseOffer: OfferResult,
  signals: UserSignals,
  ctaStrategy: 'value' | 'urgency' | 'benefit' = 'value'
): OfferResult {
  if (!decision.should_show_upgrade || !decision.target_plan) {
    return baseOffer;
  }

  const segment = getUserSegment(signals);
  const targetPlan = decision.target_plan;
  const planCapitalized = targetPlan === 'pro' ? 'Pro' : targetPlan === 'growth' ? 'Growth' : 'Studio';

  let adjustedOfferType = baseOffer.offer_type;
  let adjustedMessage = baseOffer.message;
  let adjustedCtaText = baseOffer.cta_text;

  // 1. Determine CTA format adjustments based on segment and UI pressure
  if (segment === 'high_intent') {
    // Escalate format to high-visibility modes (modal or checkout_nudge)
    if (baseOffer.offer_type === 'soft_banner') {
      adjustedOfferType = 'modal';
    }
  } else if (segment === 'power') {
    // Escalate to checkout nudge
    if (baseOffer.offer_type === 'soft_banner') {
      adjustedOfferType = 'checkout_nudge';
    }
  }

  // 2. Tailor Copywriting strategy
  if (segment === 'high_intent') {
    if (ctaStrategy === 'urgency') {
      adjustedMessage = `Ready to scale? Select your plan now and get instant access to unlimited ${planCapitalized} features.`;
      adjustedCtaText = `Unlock ${planCapitalized} Immediately`;
    } else {
      adjustedMessage = `Complete your upgrade to ${planCapitalized} to remove all boundaries on your invoicing workflow.`;
      adjustedCtaText = `Upgrade to ${planCapitalized} now`;
    }
  } else if (segment === 'power') {
    adjustedMessage = `You are running a growing business with ${signals.invoice_count} invoices created. Upgrade to ${planCapitalized} to automate your invoices and quotes.`;
    adjustedCtaText = `Scale Your Business with ${planCapitalized}`;
  } else {
    // free segment
    if (ctaStrategy === 'benefit') {
      adjustedMessage = `Remove the watermark, customize templates, and send professional invoices on ${planCapitalized}.`;
      adjustedCtaText = `Start sending on ${planCapitalized}`;
    }
  }

  return {
    message: adjustedMessage,
    cta_text: adjustedCtaText,
    offer_type: adjustedOfferType,
  };
}
