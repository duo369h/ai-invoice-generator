/**
 * REVENUE_LEARNING_AGGREGATOR.ts — v3.2 Closed Loop
 *
 * Offline batch service: reads outcome history, computes per-segment
 * strategy rankings, revenue uplift, and churn risk proxies.
 *
 * Called by: background jobs / API on demand — NEVER in hot request path.
 *
 * ❌ PROHIBITED: AI, real-time invocation, random(), mutation of execution data
 * ✅ ALLOWED: Aggregate stats, offline batch computation, reporting
 */

import {
  buildLearningMatrix,
  getBestCellForClient,
  mapToLearningClientType,
  type LearningClientType,
  type LearningStrategy,
  type LearningMatrixSnapshot,
  type OutcomeRow,
} from "./REVENUE_STRATEGY_LEARNING_MATRIX";

const CLIENT_TYPES: LearningClientType[] = ["new", "repeat", "long_term"];
const STRATEGIES: LearningStrategy[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];

export interface SegmentInsight {
  clientType: LearningClientType;
  bestStrategy: LearningStrategy | null;
  worstStrategy: LearningStrategy | null;
  bestWinRate: number;
  worstWinRate: number;
  sampleCount: number;
}

export interface RevenueUpliftEntry {
  strategy: LearningStrategy;
  avgRevenue: number;
  upliftVsBaseline: number;   // % delta vs BALANCED (baseline strategy)
  sampleSize: number;
}

// Churn risk proxy: % of deals that ended as LOST after being previously WON
export interface ChurnRiskProxy {
  clientType: LearningClientType;
  lossRate: number;           // LOST / (WON + LOST)
  riskLevel: "low" | "medium" | "high";
}

export interface AggregatedLearningReport {
  matrixSnapshot: LearningMatrixSnapshot;
  bestStrategyBySegment: Record<LearningClientType, LearningStrategy | null>;
  worstStrategyBySegment: Record<LearningClientType, LearningStrategy | null>;
  segmentInsights: SegmentInsight[];
  revenueUpliftMap: Record<LearningStrategy, RevenueUpliftEntry>;
  churnRiskProxy: ChurnRiskProxy[];
  totalOutcomesAnalyzed: number;
  reportGeneratedAt: number;
}

function computeChurnRisk(
  outcomes: OutcomeRow[],
  clientType: LearningClientType
): ChurnRiskProxy {
  const relevant = outcomes.filter(
    (r) =>
      mapToLearningClientType(r.client_type) === clientType &&
      (r.outcome === "WON" || r.outcome === "LOST")
  );

  const lost = relevant.filter((r) => r.outcome === "LOST").length;
  const lossRate = relevant.length > 0 ? lost / relevant.length : 0;

  return {
    clientType,
    lossRate: parseFloat(lossRate.toFixed(3)),
    riskLevel: lossRate >= 0.6 ? "high" : lossRate >= 0.35 ? "medium" : "low",
  };
}

function computeRevenueUplift(
  snapshot: LearningMatrixSnapshot
): Record<LearningStrategy, RevenueUpliftEntry> {
  // Baseline: BALANCED strategy across all segments (equal weight)
  const balancedRevenues = CLIENT_TYPES.map(
    (ct) => snapshot.matrix[ct].BALANCED.avgRevenue
  ).filter((v) => v > 0);

  const baselineRevenue =
    balancedRevenues.length > 0
      ? balancedRevenues.reduce((s, v) => s + v, 0) / balancedRevenues.length
      : 0;

  const upliftMap = {} as Record<LearningStrategy, RevenueUpliftEntry>;

  for (const strategy of STRATEGIES) {
    const revenues = CLIENT_TYPES.map(
      (ct) => snapshot.matrix[ct][strategy]
    ).filter((cell) => cell.reliable && cell.avgRevenue > 0);

    const avgRevenue =
      revenues.length > 0
        ? revenues.reduce((s, c) => s + c.avgRevenue, 0) / revenues.length
        : 0;

    const totalSamples = revenues.reduce((s, c) => s + c.sampleSize, 0);

    const uplift =
      baselineRevenue > 0
        ? ((avgRevenue - baselineRevenue) / baselineRevenue) * 100
        : 0;

    upliftMap[strategy] = {
      strategy,
      avgRevenue: parseFloat(avgRevenue.toFixed(2)),
      upliftVsBaseline: parseFloat(uplift.toFixed(1)),
      sampleSize: totalSamples,
    };
  }

  return upliftMap;
}

/**
 * generateAggregatedReport — the main offline aggregation entry point.
 * Pass all resolved outcomes. Returns a complete learning report.
 */
export function generateAggregatedReport(
  outcomes: OutcomeRow[],
  existingMatrixVersion = 0
): AggregatedLearningReport {
  const matrixSnapshot = buildLearningMatrix(outcomes, existingMatrixVersion);

  const bestStrategyBySegment: Record<LearningClientType, LearningStrategy | null> =
    {} as Record<LearningClientType, LearningStrategy | null>;
  const worstStrategyBySegment: Record<LearningClientType, LearningStrategy | null> =
    {} as Record<LearningClientType, LearningStrategy | null>;
  const segmentInsights: SegmentInsight[] = [];

  for (const ct of CLIENT_TYPES) {
    const best = getBestCellForClient(matrixSnapshot, ct);
    bestStrategyBySegment[ct] = best?.strategy ?? null;

    // Worst: lowest score among reliable cells
    let worst: { strategy: LearningStrategy; score: number } | null = null;
    const row = matrixSnapshot.matrix[ct];
    for (const strategy of STRATEGIES) {
      const cell = row[strategy];
      if (!cell.reliable) continue;
      if (worst === null || cell.score < worst.score) {
        worst = { strategy, score: cell.score };
      }
    }
    worstStrategyBySegment[ct] = worst?.strategy ?? null;

    const reliableRow = STRATEGIES.map((s) => row[s]).filter((c) => c.reliable);
    const totalSample = reliableRow.reduce((s, c) => s + c.sampleSize, 0);
    const bestWinRate = best?.cell.winRate ?? 0;
    const worstWinRate = worst
      ? row[worst.strategy].winRate
      : 0;

    segmentInsights.push({
      clientType: ct,
      bestStrategy: bestStrategyBySegment[ct],
      worstStrategy: worstStrategyBySegment[ct],
      bestWinRate,
      worstWinRate,
      sampleCount: totalSample,
    });
  }

  const revenueUpliftMap = computeRevenueUplift(matrixSnapshot);
  const churnRiskProxy = CLIENT_TYPES.map((ct) => computeChurnRisk(outcomes, ct));

  return {
    matrixSnapshot,
    bestStrategyBySegment,
    worstStrategyBySegment,
    segmentInsights,
    revenueUpliftMap,
    churnRiskProxy,
    totalOutcomesAnalyzed: outcomes.length,
    reportGeneratedAt: Date.now(),
  };
}
