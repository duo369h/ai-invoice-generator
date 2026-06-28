/**
 * OBSERVABILITY ONLY
 * DO NOT USE FOR DECISION MAKING
 *
 * REVENUE_STRATEGY_BIAS_ENGINE.ts — v3.3 Strategy Learning Injection Layer
 *
 * Core bias engine: reads historical outcome stats per (user segment × strategy)
 * and produces a bias map that can SOFTLY adjust future recommendations.
 *
 * Input:  resolved outcome records per user segment
 * Output: { recommendedStrategyBias, confidenceMatrix }
 *
 * ❌ PROHIBITED: AI, random(), override of rule engine, external API
 * ✅ ALLOWED: Statistical aggregation, weight computation, advisory output
 *
 * The bias engine NEVER changes what the rule engine decides.
 * It only produces a "lean" that the recommendation layer can optionally use.
 */

export type UserSegment = "PRICE_SENSITIVE" | "VALUE_SEEKER" | "FAST_CLOSER" | "HIGH_VALUE" | "UNKNOWN";
export type BiasStrategy = "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";

const STRATEGIES: BiasStrategy[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
const SEGMENTS: UserSegment[] = ["PRICE_SENSITIVE", "VALUE_SEEKER", "FAST_CLOSER", "HIGH_VALUE"];

export interface BiasCell {
  winRate: number;
  avgRevenue: number;
  confidence: number;    // 0–100: based on sample size and win rate consistency
  sampleSize: number;
  reliable: boolean;     // sampleSize >= 5
}

export type SegmentStrategyBiasMap = {
  [segment in UserSegment]?: {
    [strategy in BiasStrategy]?: BiasCell;
  };
};

export interface StrategyBiasOutput {
  recommendedStrategyBias: {
    [segment in UserSegment]?: BiasStrategy;  // Best strategy for each segment
  };
  confidenceMatrix: {
    [segment in UserSegment]?: {
      [strategy in BiasStrategy]?: number;    // Confidence score per cell
    };
  };
  biasMap: SegmentStrategyBiasMap;
  totalSamplesUsed: number;
  computedAt: number;
}

// Input record type — sourced from revenue_outcomes table
export interface OutcomeRecord {
  user_segment: UserSegment;    // Behavioral segment of the client
  strategy_used: BiasStrategy;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  price_offered: number;
  price_accepted?: number | null;
}

const MIN_RELIABLE_SAMPLES = 5;
const WEIGHT_WIN_RATE = 0.65;
const WEIGHT_REVENUE = 0.35;

function computeConfidence(sampleSize: number, winRate: number): number {
  if (sampleSize < MIN_RELIABLE_SAMPLES) return 0;
  const sampleScore = Math.min(sampleSize / 25, 1) * 60; // Up to 60pts from sample size
  const winScore = winRate * 40;                           // Up to 40pts from win rate
  return Math.round(Math.min(95, sampleScore + winScore));
}

function computeWeightedScore(winRate: number, avgRevenue: number, maxRevenue: number): number {
  const normalizedRevenue = maxRevenue > 0 ? avgRevenue / maxRevenue : 0;
  return WEIGHT_WIN_RATE * winRate + WEIGHT_REVENUE * normalizedRevenue;
}

/**
 * buildStrategyBias — compute the full bias map from resolved outcomes.
 * Only resolved outcomes (outcome !== 'PENDING') are used.
 */
export function buildStrategyBias(outcomes: OutcomeRecord[]): StrategyBiasOutput {
  const resolved = outcomes.filter((r) => r.outcome !== "PENDING");

  // ── Step 1: Aggregate raw stats per (segment × strategy) ──────────────────
  const rawMap: SegmentStrategyBiasMap = {};
  let maxRevenue = 0;

  for (const segment of SEGMENTS) {
    rawMap[segment] = {};
    for (const strategy of STRATEGIES) {
      const cellRows = resolved.filter(
        (r) => r.user_segment === segment && r.strategy_used === strategy
      );
      const won = cellRows.filter((r) => r.outcome === "WON");
      const winRate = cellRows.length > 0 ? won.length / cellRows.length : 0;
      const avgRevenue =
        won.length > 0
          ? won.reduce((s, r) => s + (r.price_accepted ?? 0), 0) / won.length
          : 0;

      if (avgRevenue > maxRevenue) maxRevenue = avgRevenue;

      rawMap[segment]![strategy] = {
        winRate: parseFloat(winRate.toFixed(3)),
        avgRevenue: parseFloat(avgRevenue.toFixed(2)),
        confidence: 0, // computed after maxRevenue is known
        sampleSize: cellRows.length,
        reliable: cellRows.length >= MIN_RELIABLE_SAMPLES,
      };
    }
  }

  // ── Step 2: Compute confidence scores and totals ───────────────────────────
  let totalSamplesUsed = 0;
  for (const segment of SEGMENTS) {
    for (const strategy of STRATEGIES) {
      const cell = rawMap[segment]![strategy]!;
      cell.confidence = computeConfidence(cell.sampleSize, cell.winRate);
      if (cell.reliable) totalSamplesUsed += cell.sampleSize;
    }
  }

  // ── Step 3: Pick best strategy per segment (highest weighted score among reliable cells) ──
  const recommendedStrategyBias: StrategyBiasOutput["recommendedStrategyBias"] = {};
  const confidenceMatrix: StrategyBiasOutput["confidenceMatrix"] = {};

  for (const segment of SEGMENTS) {
    confidenceMatrix[segment] = {};
    let bestStrategy: BiasStrategy | null = null;
    let bestScore = -1;

    for (const strategy of STRATEGIES) {
      const cell = rawMap[segment]![strategy]!;
      confidenceMatrix[segment]![strategy] = cell.confidence;

      if (!cell.reliable) continue; // sampleSize < 5 → skip

      const score = computeWeightedScore(cell.winRate, cell.avgRevenue, maxRevenue);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    if (bestStrategy) {
      recommendedStrategyBias[segment] = bestStrategy;
    }
  }

  return {
    recommendedStrategyBias,
    confidenceMatrix,
    biasMap: rawMap,
    totalSamplesUsed,
    computedAt: Date.now(),
  };
}

/**
 * getBiasForSegment — get the recommended strategy bias for a given segment.
 * Returns null if no reliable data exists (callers should fall back to base rule engine).
 */
export function getBiasForSegment(
  biasOutput: StrategyBiasOutput,
  segment: UserSegment
): { strategy: BiasStrategy; confidence: number } | null {
  const strategy = biasOutput.recommendedStrategyBias[segment];
  if (!strategy) return null;

  const confidence = biasOutput.confidenceMatrix[segment]?.[strategy] ?? 0;
  return { strategy, confidence };
}

/**
 * classifySegmentFromOutcomes — infer user segment from behavioral patterns.
 * This is the bridge between the USER_SEGMENT_ENGINE and the bias engine.
 *
 * Simple rule-based mapping — NO AI.
 */
export function classifySegmentFromSignals(signals: {
  avgRevisionCount: number;
  avgTimeToDecisionHours: number;
  avgAcceptedPriceRatio: number;
  winRate: number;
}): UserSegment {
  const { avgRevisionCount, avgTimeToDecisionHours, avgAcceptedPriceRatio, winRate } = signals;

  if (avgAcceptedPriceRatio > 1.05 && winRate > 0.55) return "HIGH_VALUE";
  if (avgTimeToDecisionHours < 10 && avgRevisionCount < 1.5 && winRate > 0.5) return "FAST_CLOSER";
  if (avgAcceptedPriceRatio < 0.85 || avgRevisionCount > 2.0) return "PRICE_SENSITIVE";
  if (winRate > 0.35 && avgRevisionCount < 2.5) return "VALUE_SEEKER";

  return "UNKNOWN";
}
