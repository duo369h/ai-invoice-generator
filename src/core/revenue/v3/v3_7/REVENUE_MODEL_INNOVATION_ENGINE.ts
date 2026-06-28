/**
 * REVENUE_MODEL_INNOVATION_ENGINE.ts — v3.7 Revenue Model Innovation Engine
 *
 * Integrates the generator, simulation, ranking, and trigger modules
 * to suggest alternative pricing and commercial model candidate structures.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Deterministic pipeline integration, portfolio scoring
 */

import { generateRevenueModels, type RevenueModel } from "./REVENUE_MODEL_GENERATOR";
export type { RevenueModel };
import { simulateRevenueModels } from "./REVENUE_MODEL_SIMULATION_ENGINE";
import { rankRevenueModels } from "./REVENUE_MODEL_RANKING_ENGINE";
import { evaluateInnovationTrigger } from "./REVENUE_INNOVATION_TRIGGER_ENGINE";

export interface InnovationOutcomeRecord {
  client_type: string;
  strategy_used: string;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  price_offered: number;
  price_accepted?: number | null;
  timestamp: number;
}

export interface InnovationInput {
  outcomeHistory: InnovationOutcomeRecord[];
  segmentMatrix: {
    reliableCells: number;
  };
  strategyEvolution: {
    averageDriftScore: number;
  };
  revenueTrajectories: {
    revenueTrend: "UP" | "FLAT" | "DOWN";
    growthDirection: "REVENUE_MAXIMIZATION" | "VOLUME_ACCELERATION" | "CONVERSION_EQUILIBRIUM";
  };
  clientType: "new" | "repeat" | "long_term";
  stabilityScore?: number;
}

export interface InnovationOutput {
  candidateModels: RevenueModel[];
  bestModel: RevenueModel | null;
  innovationScore: number;
  allowInnovation: boolean;
  triggerReason: string;
}

/**
 * getModelInnovation — runs the model generation and simulation lifecycle.
 */
export function getModelInnovation(input: InnovationInput): InnovationOutput {
  const { outcomeHistory, segmentMatrix, strategyEvolution, revenueTrajectories, clientType, stabilityScore = 75 } = input;

  const resolved = outcomeHistory.filter((o) => o.outcome === "WON" || o.outcome === "LOST");
  const won = resolved.filter((o) => o.outcome === "WON");

  const totalResolvedCount = resolved.length;
  const winRate = totalResolvedCount > 0 ? won.length / totalResolvedCount : 0.5;

  const repeatCount = outcomeHistory.filter((o) => o.client_type === "repeat" || o.client_type === "long_term").length;
  const repeatClientRatio = outcomeHistory.length > 0 ? repeatCount / outcomeHistory.length : 0;

  const avgPrice = won.length > 0
    ? won.reduce((sum, o) => sum + (o.price_accepted ?? o.price_offered), 0) / won.length
    : 1000;

  // Compute win rate spread between strategies
  const stratWinRates = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"].map((s) => {
    const sOutcomes = resolved.filter((o) => o.strategy_used === s);
    return sOutcomes.length > 0
      ? sOutcomes.filter((o) => o.outcome === "WON").length / sOutcomes.length
      : 0.5;
  });
  const maxWinRate = Math.max(...stratWinRates);
  const minWinRate = Math.min(...stratWinRates);
  const strategyWinRateSpread = maxWinRate - minWinRate;

  // 1️⃣ Run Trigger Check
  const trigger = evaluateInnovationTrigger({
    stabilityScore,
    revenueVolatility: strategyEvolution.averageDriftScore,
    strategyWinRateSpread,
    totalOutcomesCount: totalResolvedCount,
  });

  if (!trigger.allowInnovation) {
    return {
      candidateModels: [],
      bestModel: null,
      innovationScore: 0,
      allowInnovation: false,
      triggerReason: trigger.reason,
    };
  }

  // 2️⃣ Generate Models
  const isPriceSensitive = revenueTrajectories.growthDirection === "VOLUME_ACCELERATION" || winRate < 0.40;
  const generatorResult = generateRevenueModels({
    clientType,
    avgAcceptedPrice: avgPrice,
    totalResolvedCount,
    repeatClientRatio,
    isPriceSensitive,
  });

  // 3️⃣ Run Simulation (baseline yield = avgPrice * resolved deals)
  const baselineRev = avgPrice * Math.max(1, won.length);
  const simulationResult = simulateRevenueModels(
    generatorResult.generatedModels,
    baselineRev,
    winRate
  );

  // 4️⃣ Rank Models
  const rankingResult = rankRevenueModels(
    generatorResult.generatedModels,
    simulationResult.simulations
  );

  return {
    candidateModels: rankingResult.rankedModels,
    bestModel: rankingResult.bestModel,
    innovationScore: generatorResult.confidence,
    allowInnovation: true,
    triggerReason: trigger.reason,
  };
}
