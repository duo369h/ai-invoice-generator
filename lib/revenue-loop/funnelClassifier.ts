/**
 * Revenue Optimization Loop - Funnel Classifier — Corvioz v8
 *
 * Classifies users into standard engagement funnel segments based on behavior signals.
 */

import { BehaviorSignals } from './behaviorTracker';

export type UserFunnelStage = 'visitor' | 'active' | 'power_user' | 'near_conversion' | 'churn_risk';

/**
 * Classifies the user's funnel stage.
 */
export function classifyUserFunnel(signals: BehaviorSignals): UserFunnelStage {
  const { invoicesCreated, clientsCreated, pricingViewed, exportPdf } = signals;

  console.log('[REVENUE_LOOP_CLASSIFIER] Classifying user with signals:', signals);

  // Churn risk: High pricing views but zero invoices/clients created after several visits
  if (pricingViewed > 3 && invoicesCreated === 0) {
    return 'churn_risk';
  }

  // Near conversion: Pricing viewed multiple times, or exported count is at threshold limits (e.g. 3)
  if (pricingViewed >= 2 || exportPdf >= 3) {
    return 'near_conversion';
  }

  // Power user: high activity
  if (invoicesCreated > 5 || exportPdf > 4) {
    return 'power_user';
  }

  // Active: standard usage
  if (invoicesCreated > 0 || clientsCreated > 0) {
    return 'active';
  }

  return 'visitor';
}
