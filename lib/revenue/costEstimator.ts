/**
 * Cost Estimator — Corvioz v8.6
 *
 * Keeps API usage cost controlled and prevents "runaway bills".
 * Approximates API cost and provides execution recommendations based on risk thresholds.
 */

export interface CostEstimationResult {
  costUSD: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: 'allow' | 'warn' | 'block';
}

/**
 * Estimates API costs based on action type and total prompt token length.
 *
 * @param action - Action type (invoice, proposal, profile, bulk_export)
 * @param tokens - Approximate input + output tokens (or character length as proxy)
 */
export function estimateCost(action: string, tokens: number): CostEstimationResult {
  let baseCost = 0.01;
  if (action === 'proposal') baseCost = 0.05;
  if (action === 'profile') baseCost = 0.03;
  if (action === 'invoice') baseCost = 0.01;
  if (action === 'bulk_export') baseCost = 0.10;

  // Rough estimation: $0.20 per 1M tokens (0.0000002 USD per token)
  const tokenCost = tokens * 0.00002;
  const costUSD = Number((baseCost + tokenCost).toFixed(5));

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let recommendation: 'allow' | 'warn' | 'block' = 'allow';

  // Cost safety gates:
  // - High Risk: > $0.08 (exceeding standard budget)
  // - Medium Risk: > $0.03 (alert and caution)
  if (costUSD > 0.08) {
    riskLevel = 'high';
    recommendation = 'block';
  } else if (costUSD > 0.03) {
    riskLevel = 'medium';
    recommendation = 'warn';
  }

  return {
    costUSD,
    riskLevel,
    recommendation,
  };
}
