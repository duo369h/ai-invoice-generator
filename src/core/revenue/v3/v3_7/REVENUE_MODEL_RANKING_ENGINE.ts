/**
 * REVENUE_MODEL_RANKING_ENGINE.ts — v3.7 Model Ranking Engine
 *
 * Ranks candidate models using risk-adjusted expected value formula.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Formulaic sorting, tie-breaking heuristics, optimal model extraction
 */

import type { RevenueModel } from "./REVENUE_MODEL_GENERATOR";
import type { SimulationResult } from "./REVENUE_MODEL_SIMULATION_ENGINE";

export interface RankingOutput {
  rankedModels: RevenueModel[];
  bestModel: RevenueModel;
  scores: Record<string, number>;
}

/**
 * rankRevenueModels — scores and orders models by expected net yield.
 */
export function rankRevenueModels(
  models: RevenueModel[],
  simulations: SimulationResult[]
): RankingOutput {
  const scores: Record<string, number> = {};

  // 1️⃣ Score each candidate using a risk-adjusted expected value formula
  for (const sim of simulations) {
    const modelMeta = models.find((m) => m.modelType === sim.model);
    if (!modelMeta) continue;

    // Yield Score = projectedRevenue * conversionProbability * (1 - churnRiskPercentage)
    const riskFactor = 1 - sim.churnRisk / 100;
    const score = sim.projectedRevenue * sim.conversionRate * riskFactor;
    scores[sim.model] = parseFloat(score.toFixed(2));
  }

  // 2️⃣ Sort models by score descending
  const rankedModels = [...models].sort((a, b) => {
    const scoreA = scores[a.modelType] ?? 0;
    const scoreB = scores[b.modelType] ?? 0;
    return scoreB - scoreA;
  });

  const bestModel = rankedModels[0] || {
    modelType: "PACKAGE_BUNDLING",
    description: "Standard bundling model",
    expectedRevenueImpact: 10,
    riskLevel: "LOW",
  };

  return {
    rankedModels,
    bestModel,
    scores,
  };
}
