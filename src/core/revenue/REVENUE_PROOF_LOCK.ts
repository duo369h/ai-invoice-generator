/**
 * Corvioz — Revenue Proof Lock System
 *
 * Ensures revenue proof moments are ONLY recorded via the singular proposal loop path.
 */

export interface RevenueProofLockInput {
  proposal_won: boolean;
  ai_used: boolean;
  revenue: number;
}

export interface RevenueProofLockResult {
  revenue_proof: boolean;
  source: 'proposal_loop_only';
}

/**
 * Validates and triggers the Revenue Proof state only when all primary loop conditions are met.
 */
export function checkRevenueProof(input: RevenueProofLockInput): RevenueProofLockResult {
  const triggered =
    input.proposal_won === true &&
    input.ai_used === true &&
    input.revenue > 0;

  return {
    revenue_proof: triggered,
    source: 'proposal_loop_only',
  };
}
