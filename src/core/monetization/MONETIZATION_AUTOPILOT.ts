/**
 * Corvioz — Monetization Autopilot [DEPRECATED - WRAPPER ONLY]
 *
 * All decision logic has been migrated to CORVIOZ_DECISION_KERNEL.
 */

import { getCorviozDecision } from '../kernel/CORVIOZ_DECISION_KERNEL.ts';

export type MonetizationAction = 'show_paywall' | 'suggest_upgrade' | 'no_action';
export type MonetizationPlan = 'starter' | 'growth' | 'studio';
export type MonetizationUrgency = 'low' | 'medium' | 'high';

export interface MonetizationUserState {
  first_revenue_proof_triggered?: boolean;
  first_proposal_win?: boolean;
  ai_contribution_score?: number;
  revenue_uplift?: number;
  win_rate_uplift?: number;
  deal_size_uplift?: number;
}

export interface MonetizationDecision {
  action: MonetizationAction;
  recommended_plan: MonetizationPlan;
  recommended_price_usd: 9 | 19 | 29;
  urgency: MonetizationUrgency;
  reason: string;
  context?: string;
}

export const ONLY_TRIGGER_IF = "proposal_created";

export function decideMonetizationAction(
  userState: MonetizationUserState = {},
  userId = 'unknown'
): MonetizationDecision {
  const decision = getCorviozDecision(userState);

  return {
    action: decision.paywallAllowed ? 'suggest_upgrade' : 'no_action',
    recommended_plan: 'starter',
    recommended_price_usd: 9,
    urgency: 'low',
    reason: decision.reason,
    context: 'proposal_flow_only',
  };
}
