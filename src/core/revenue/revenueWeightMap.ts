/**
 * Corvioz Revenue Signal Engine — Deterministic Weight Map
 * Sprint C Phase 2.8
 *
 * Maps canonical analytics events and unified funnel stages to deterministic revenue intent weights.
 * PURE DATA & DETERMINISTIC LOOKUP ONLY. No AI, no dynamic optimization, no side effects.
 */

import { EVENTS, type EventName } from '../analytics/events';

/**
 * Base revenue intent score (0 - 100) assigned to each canonical event.
 */
export const EVENT_REVENUE_WEIGHTS: Record<EventName, number> = {
  // Top of funnel / Awareness
  [EVENTS.LANDING_VIEW]: 2,
  [EVENTS.SCROLL_DEPTH_50]: 5,
  [EVENTS.SCROLL_DEPTH_90]: 8,
  [EVENTS.TEMPLATE_VIEWED]: 12,
  // Analytics-only activation events must not change revenue scoring.
  [EVENTS.PHOTOGRAPHER_CTA_CLICK]: 0,

  // Consideration / Engagement
  [EVENTS.CTA_CLICK]: 15,
  [EVENTS.PRICING_VIEW]: 25,
  [EVENTS.PLAN_HOVER]: 30,

  // Activation / Value creation intent
  [EVENTS.SIGNUP_STARTED]: 35,
  [EVENTS.DASHBOARD_ENTERED]: 40,
  [EVENTS.BETA_FEEDBACK_CLICKED]: 5,
  [EVENTS.FIRST_ACTION_TAKEN]: 45,
  [EVENTS.QUOTE_CREATED_INTENT]: 50,
  [EVENTS.FIRST_QUOTE_CREATED]: 0,
  [EVENTS.SIGNUP_TO_FIRST_QUOTE_COMPLETED]: 70,
  [EVENTS.INVOICE_CREATED_INTENT]: 55,
  [EVENTS.FIRST_INVOICE_CREATED]: 0,

  // High Intent / Decision
  [EVENTS.SIGNUP_COMPLETED]: 60,
  [EVENTS.PLAN_SELECTED]: 75,
  [EVENTS.CHECKOUT_STARTED]: 90,

  // Onboarding & Activation
  [EVENTS.FIRST_VALUE_CREATED]: 80,
  [EVENTS.ONBOARDING_DROPOFF]: 10,
};

/**
 * Multipliers for canonical funnel stages.
 */
export const FUNNEL_STAGE_MULTIPLIERS: Record<string, number> = {
  LANDING: 1.0,
  ONBOARDING: 1.2,
  PRICING: 1.5,
  CHECKOUT: 2.0,
  SIGNUP: 1.3,
};

/**
 * Returns the deterministic weight for a given event name.
 * Fallback weight is 5 for unmapped events.
 */
export function getEventRevenueWeight(eventName: string): number {
  if (eventName in EVENT_REVENUE_WEIGHTS) {
    return EVENT_REVENUE_WEIGHTS[eventName as EventName];
  }
  // Try case-insensitive matching if needed
  const upper = eventName.toUpperCase() as EventName;
  if (upper in EVENT_REVENUE_WEIGHTS) {
    return EVENT_REVENUE_WEIGHTS[upper];
  }
  return 5;
}

/**
 * Returns the deterministic stage multiplier for a given stage.
 */
export function getStageMultiplier(stage: string): number {
  if (!stage) return 1.0;
  const upperStage = stage.toUpperCase();
  return FUNNEL_STAGE_MULTIPLIERS[upperStage] ?? 1.0;
}
