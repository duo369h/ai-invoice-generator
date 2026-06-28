/**
 * Corvioz — Revenue Causality Engine [DEPRECATED - WRAPPER ONLY]
 *
 * All decision logic has been migrated to CORVIOZ_DECISION_KERNEL.
 */

import { getCorviozDecision } from '../kernel/CORVIOZ_DECISION_KERNEL.ts';

export type RevenueCausalityAiAction =
  | 'pricing_suggestion'
  | 'proposal_optimization'
  | 'follow_up_suggestion';

export type RevenueCausalityOutcome = 'won' | 'lost' | 'open' | 'unknown';

export interface RevenueCausalityProposal {
  id: string;
  user_id?: string;
  status?: string;
  outcome?: RevenueCausalityOutcome | string;
  value?: number;
  total?: number;
  amount?: number;
  deal_id?: string | null;
  created_at?: string;
  closed_at?: string | null;
  used_ai?: boolean;
}

export interface RevenueCausalityDeal {
  id: string;
  user_id?: string;
  proposal_id?: string | null;
  status?: string;
  outcome?: RevenueCausalityOutcome | string;
  value?: number;
  total?: number;
  amount?: number;
  revenue_before?: number;
  revenue_after?: number;
  closed_at?: string | null;
}

export interface RevenueCausalityAiInteraction {
  id: string;
  user_id?: string;
  proposal_id?: string | null;
  deal_id?: string | null;
  action: string;
  accepted?: boolean;
  accepted_at?: string | null;
  created_at?: string;
  revenue_delta?: number;
}

export interface RevenueCausalitySnapshot {
  id?: string;
  user_id?: string;
  revenue_before?: number;
  revenue_after?: number;
  win_rate_before?: number;
  win_rate_after?: number;
  deal_size_before?: number;
  deal_size_after?: number;
  ai_influence_score?: number;
  first_revenue_proof_triggered?: boolean;
  created_at?: string;
}

export interface RevenueCausalityInput {
  proposals?: RevenueCausalityProposal[];
  deals?: RevenueCausalityDeal[];
  ai_interactions?: RevenueCausalityAiInteraction[];
  revenue_snapshots?: RevenueCausalitySnapshot[];
}

export interface RevenueAttribution {
  ai_interaction_id: string;
  action: string;
  proposal_id: string | null;
  deal_id: string | null;
  proposal_outcome: RevenueCausalityOutcome;
  deal_outcome: RevenueCausalityOutcome;
  revenue_delta: number;
  ai_contribution_score: number;
}

export interface RevenueSnapshotUpdate {
  user_id: string;
  revenue_before: number;
  revenue_after: number;
  win_rate_before: number;
  win_rate_after: number;
  ai_influence_score: number;
  first_revenue_proof_triggered: boolean;
}

export interface RevenueCausalityResult {
  user_id: string;
  revenue_uplift: number;
  win_rate_uplift: number;
  deal_size_uplift: number;
  ai_influence_contribution: number;
  ai_contribution_score: number;
  first_revenue_proof_triggered: boolean;
  attribution: RevenueAttribution[];
  revenue_snapshot_update: RevenueSnapshotUpdate;
}

export const ZERO_REVENUE: RevenueCausalityResult = {
  user_id: '',
  revenue_uplift: 0,
  win_rate_uplift: 0,
  deal_size_uplift: 0,
  ai_influence_contribution: 0,
  ai_contribution_score: 0,
  first_revenue_proof_triggered: false,
  attribution: [],
  revenue_snapshot_update: {
    user_id: '',
    revenue_before: 0,
    revenue_after: 0,
    win_rate_before: 0,
    win_rate_after: 0,
    ai_influence_score: 0,
    first_revenue_proof_triggered: false,
  },
};

export function buildRevenueSnapshotOnDealClosure(
  userId: string,
  input: RevenueCausalityInput = {}
): RevenueSnapshotUpdate {
  return calculateRevenueCausality(userId, input).revenue_snapshot_update;
}

export function reconcileRevenueSnapshotsOnDealClosure(
  userId: string,
  input: RevenueCausalityInput = {}
): RevenueCausalitySnapshot[] {
  const snapshotUpdate = buildRevenueSnapshotOnDealClosure(userId, input);
  return [
    ...(input.revenue_snapshots || []),
    {
      ...snapshotUpdate,
      created_at: new Date(0).toISOString(),
    },
  ];
}

export function calculateRevenueCausality(
  userId: string,
  input: RevenueCausalityInput = {}
): RevenueCausalityResult {
  const decision = getCorviozDecision(input);

  // If revenue tracking is off in the kernel
  if (decision.revenueMode === 'OFF') {
    return {
      ...ZERO_REVENUE,
      user_id: userId,
      revenue_snapshot_update: { ...ZERO_REVENUE.revenue_snapshot_update, user_id: userId },
    };
  }

  const proposals = input.proposals || [];
  const wonProposals = proposals.filter(p =>
    ['won', 'approved', 'accepted', 'converted', 'paid'].includes(String(p.outcome || p.status || '').toLowerCase())
  );
  
  const revenueAfter = wonProposals.reduce((sum, p) => sum + (p.value ?? p.total ?? p.amount ?? 0), 0);
  const proposal_used_ai = proposals.some(p => p.used_ai === true) || 
    (input.ai_interactions || []).some(inter => inter.accepted === true);

  const aiContributionScore = (proposal_used_ai && wonProposals.length > 0) ? 100 : 0;
  const firstRevenueProofTriggered = proposal_used_ai && wonProposals.length > 0 && revenueAfter > 0;

  return {
    user_id: userId,
    revenue_uplift: revenueAfter,
    win_rate_uplift: wonProposals.length / Math.max(1, proposals.length),
    deal_size_uplift: revenueAfter / Math.max(1, wonProposals.length),
    ai_influence_contribution: aiContributionScore,
    ai_contribution_score: aiContributionScore,
    first_revenue_proof_triggered: firstRevenueProofTriggered,
    attribution: [],
    revenue_snapshot_update: {
      user_id: userId,
      revenue_before: 0,
      revenue_after: revenueAfter,
      win_rate_before: 0,
      win_rate_after: wonProposals.length / Math.max(1, proposals.length),
      ai_influence_score: aiContributionScore,
      first_revenue_proof_triggered: firstRevenueProofTriggered,
    },
  };
}
