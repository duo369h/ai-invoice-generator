/**
 * REVENUE_STRATEGY_RECOMMENDER.ts — v3.2 Non-AI Strategy Recommendation Layer
 *
 * Combines client_type + urgency + historical matrix to recommend the
 * best-fit strategy for FUTURE decisions. Purely rule-based + stats.
 *
 * ❌ PROHIBITED: AI, probabilistic models, external API calls, live session data
 * ✅ ALLOWED: Rule logic, historical matrix cells, confidence-weighted scoring
 *
 * IMPORTANT: Output is a RECOMMENDATION only — the execution system
 * (REVENUE_STRATEGY_ENGINE) makes the final call. This layer CANNOT override it.
 */

import {
  checkLearningGate,
  type LearningDataSource,
} from "./REVENUE_LEARNING_GATE";
import {
  getBestStrategyForSegment,
  getCellForSegment,
  type ClientType,
  type StrategyMatrix,
} from "./REVENUE_STRATEGY_SEGMENT_ENGINE";
import type { StrategyUsed } from "./REVENUE_OUTCOME_ENGINE";

export type UrgencyLevel = "low" | "medium" | "high";

export interface StrategyRecommendation {
  recommendedStrategy: StrategyUsed;
  confidence: number;          // 0–100 (not a probability — a data quality score)
  reason: string;              // Human-readable explanation for the UI
  dataSource: LearningDataSource;
  matrixCell?: {               // The specific cell that drove the recommendation
    winRate: number;
    sampleSize: number;
  };
  fallbackUsed: boolean;       // true if no matrix data was available
}

// ─── Static fallback rules (used when matrix has no data) ────────────────────
// Based on industry heuristics, not AI inference
const URGENCY_FALLBACK: Record<UrgencyLevel, StrategyUsed> = {
  high: "FAST_DEAL",      // Speed > margin when time pressure is real
  medium: "BALANCED",     // Default safe choice
  low: "MAX_REVENUE",     // No rush = maximize value capture
};

const CLIENT_TYPE_FALLBACK: Record<ClientType, StrategyUsed> = {
  individual: "BALANCED",
  small_business: "BALANCED",
  startup: "FAST_DEAL",
  enterprise: "MAX_REVENUE",
};

function buildReason(
  strategy: StrategyUsed,
  clientType: ClientType,
  urgency: UrgencyLevel,
  winRate: number,
  sampleSize: number,
  fallbackUsed: boolean
): string {
  if (fallbackUsed) {
    return `No deal history yet for ${clientType} clients. Using ${urgency} urgency default: ${strategy}.`;
  }

  const winPct = (winRate * 100).toFixed(0);
  const clientLabel = clientType.replace("_", " ");

  switch (strategy) {
    case "MAX_REVENUE":
      return `${strategy} wins ${winPct}% with ${clientLabel} clients (${sampleSize} deals). Maximize your rate — this segment can absorb it.`;
    case "BALANCED":
      return `${strategy} has the strongest conversion for ${clientLabel} clients (${winPct}% win rate, ${sampleSize} deals). Solid risk-adjusted choice.`;
    case "FAST_DEAL":
      return `${strategy} closes fastest for ${clientLabel} clients (${winPct}% win rate, ${sampleSize} deals). ${urgency === "high" ? "Matches your urgency." : "Consider if speed > margin matters."}`;
  }
}

/**
 * recommendStrategy — compute a strategy recommendation using:
 * 1. Historical matrix (if gate passes and data is confident)
 * 2. Rule-based urgency/client-type fallback (when matrix is insufficient)
 *
 * @param clientType — the client segment
 * @param urgency    — deal urgency level
 * @param matrix     — pre-computed strategy matrix (MATRIX_SNAPSHOT source)
 * @param matrixAge  — how old the matrix is in ms (for gate validation)
 */
export function recommendStrategy(
  clientType: ClientType,
  urgency: UrgencyLevel,
  matrix: StrategyMatrix | null,
  matrixAge?: number
): StrategyRecommendation {
  // ── Gate check: is the matrix safe to use for recommendations? ─────────────
  if (matrix) {
    const gate = checkLearningGate({
      source: "MATRIX_SNAPSHOT",
      dataAge: matrixAge,
      sampleSize: Object.values(matrix).reduce((total, row) => {
        if (!row) return total;
        return (
          total +
          row.MAX_REVENUE.sampleSize +
          row.BALANCED.sampleSize +
          row.FAST_DEAL.sampleSize
        );
      }, 0),
    });

    if (gate.safeToUseForRecommendation) {
      // Try matrix-driven recommendation
      const { strategy: bestStrategy, cell: bestCell } = getBestStrategyForSegment(
        matrix,
        clientType
      );

      // If the best matrix cell has at least "low" confidence, use it
      if (bestCell.confidence !== "none" && bestCell.sampleSize >= 3) {
        // Urgency override: if urgency=high and matrix says MAX_REVENUE but
        // FAST_DEAL has medium+ confidence, prefer FAST_DEAL
        let finalStrategy = bestStrategy;
        if (urgency === "high" && bestStrategy === "MAX_REVENUE") {
          const fastDealCell = getCellForSegment(matrix, clientType, "FAST_DEAL");
          if (fastDealCell.confidence !== "none" && fastDealCell.winRate >= 0.4) {
            finalStrategy = "FAST_DEAL";
          }
        }

        const activeCell = getCellForSegment(matrix, clientType, finalStrategy);
        const confidenceScore = Math.min(
          95,
          Math.round(
            (activeCell.sampleSize / 20) * 60 + // Sample weight: up to 60pts
            activeCell.winRate * 35               // Win rate weight: up to 35pts
          )
        );

        return {
          recommendedStrategy: finalStrategy,
          confidence: confidenceScore,
          reason: buildReason(
            finalStrategy,
            clientType,
            urgency,
            activeCell.winRate,
            activeCell.sampleSize,
            false
          ),
          dataSource: "MATRIX_SNAPSHOT",
          matrixCell: {
            winRate: activeCell.winRate,
            sampleSize: activeCell.sampleSize,
          },
          fallbackUsed: false,
        };
      }
    }
  }

  // ── Fallback: static rule-based recommendation ─────────────────────────────
  // Priority: urgency takes precedence over client type for extreme values
  let fallbackStrategy: StrategyUsed;
  if (urgency === "high") {
    fallbackStrategy = URGENCY_FALLBACK.high;
  } else if (urgency === "low") {
    fallbackStrategy = URGENCY_FALLBACK.low;
  } else {
    fallbackStrategy = CLIENT_TYPE_FALLBACK[clientType];
  }

  return {
    recommendedStrategy: fallbackStrategy,
    confidence: 30, // Low confidence — no real data backing this
    reason: buildReason(fallbackStrategy, clientType, urgency, 0, 0, true),
    dataSource: "AGGREGATED_HISTORY",
    fallbackUsed: true,
  };
}

/**
 * applyLearningBias — merge a recommendation into a base strategy output.
 * Returns an enriched object with "recommendationWeight" appended.
 * DOES NOT change the base strategy. Decision remains with the execution engine.
 *
 * @param baseStrategy — the strategy already chosen by REVENUE_STRATEGY_ENGINE
 * @param recommendation — from recommendStrategy()
 */
export function applyLearningBias(
  baseStrategy: StrategyUsed,
  recommendation: StrategyRecommendation
): {
  strategy: StrategyUsed;          // Unchanged — always baseStrategy
  recommendationWeight: {
    suggestedStrategy: StrategyUsed;
    confidence: number;
    reason: string;
    aligned: boolean;              // true if recommendation matches base strategy
  };
} {
  return {
    strategy: baseStrategy, // ← NEVER overridden
    recommendationWeight: {
      suggestedStrategy: recommendation.recommendedStrategy,
      confidence: recommendation.confidence,
      reason: recommendation.reason,
      aligned: recommendation.recommendedStrategy === baseStrategy,
    },
  };
}
