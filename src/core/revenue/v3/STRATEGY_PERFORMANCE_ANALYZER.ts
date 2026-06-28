/**
 * STRATEGY_PERFORMANCE_ANALYZER.ts — v3.1.2
 *
 * Offline/async engine that reads outcome data and ranks strategies.
 * Produces "which strategy actually works for this user segment"
 * using only real historical outcomes — no AI hallucination.
 *
 * ❌ AI PROHIBITED in analysis loop.
 * ✅ ALLOWED: statistical ranking, confidence intervals, offline batch.
 */

import {
  computeOutcomeStats,
  getOutcomesByUser,
  type StrategyUsed,
} from "./REVENUE_OUTCOME_ENGINE";

export interface StrategyRanking {
  strategy: StrategyUsed;
  winRate: number;
  avgRevenueDelta: number;   // Accepted - Offered (positive = upside captured)
  sampleSize: number;
  confidenceTier: "insufficient" | "low" | "medium" | "high";
  recommendation: string;
}

export interface PerformanceAnalysis {
  userId?: string;
  rankedStrategies: StrategyRanking[];
  topStrategy: StrategyUsed | null;
  analysisNote: string;
  computedAt: number;
}

const MIN_SAMPLES: Record<StrategyRanking["confidenceTier"], number> = {
  insufficient: 0,
  low: 3,
  medium: 10,
  high: 25,
};

function getConfidenceTier(samples: number): StrategyRanking["confidenceTier"] {
  if (samples >= MIN_SAMPLES.high) return "high";
  if (samples >= MIN_SAMPLES.medium) return "medium";
  if (samples >= MIN_SAMPLES.low) return "low";
  return "insufficient";
}

function buildRecommendation(
  strategy: StrategyUsed,
  winRate: number,
  delta: number,
  tier: StrategyRanking["confidenceTier"]
): string {
  if (tier === "insufficient") {
    return `Not enough data for ${strategy} — keep using it to gather insights.`;
  }
  if (winRate > 0.7 && delta >= 0) {
    return `${strategy} is your strongest strategy — high close rate with positive revenue capture.`;
  }
  if (winRate > 0.5) {
    return `${strategy} performs solidly. Consider refining for higher-value clients.`;
  }
  return `${strategy} has room to improve. Try on lower-urgency clients first.`;
}

/**
 * analyzeStrategyPerformance — computes ranked strategy list for a user.
 * Runs asynchronously (offline-safe). No AI involved.
 */
export function analyzeStrategyPerformance(userId?: string): PerformanceAnalysis {
  const stats = computeOutcomeStats(userId);
  const records = userId ? getOutcomesByUser(userId) : [];

  const strategies: StrategyUsed[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
  const rankedStrategies: StrategyRanking[] = strategies.map((strategy) => {
    const perf = stats.strategyPerformance[strategy];
    const sampleSize = records.filter(
      (r) => r.strategy_used === strategy && r.outcome !== "PENDING"
    ).length;
    const tier = getConfidenceTier(sampleSize);

    return {
      strategy,
      winRate: perf?.winRate ?? 0,
      avgRevenueDelta: perf?.avgDelta ?? 0,
      sampleSize,
      confidenceTier: tier,
      recommendation: buildRecommendation(strategy, perf?.winRate ?? 0, perf?.avgDelta ?? 0, tier),
    };
  });

  // Sort: high-confidence + high win rate first
  rankedStrategies.sort((a, b) => {
    const tierOrder = { high: 3, medium: 2, low: 1, insufficient: 0 };
    const tierDiff = tierOrder[b.confidenceTier] - tierOrder[a.confidenceTier];
    if (tierDiff !== 0) return tierDiff;
    return b.winRate - a.winRate;
  });

  const topStrategy =
    rankedStrategies[0]?.confidenceTier !== "insufficient"
      ? rankedStrategies[0].strategy
      : null;

  const analysisNote =
    stats.learningConfidence === "cold"
      ? "System is in cold-start mode. Rankings will improve as you complete more deals."
      : stats.learningConfidence === "learning"
      ? "System is learning. Rankings have directional value but use with care."
      : "Rankings are calibrated based on your real deal history.";

  return {
    userId,
    rankedStrategies,
    topStrategy,
    analysisNote,
    computedAt: Date.now(),
  };
}
