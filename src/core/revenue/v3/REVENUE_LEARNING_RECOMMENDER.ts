/**
 * REVENUE_LEARNING_RECOMMENDER.ts — v3.3 Upgrade
 *
 * Deterministic strategy recommender upgraded with learningBias signal.
 * Priority chain (all deterministic):
 *   1. matrix winRate (primary signal)
 *   2. avgRevenue (tiebreaker)
 *   3. sampleSize (data confidence weight)
 *   4. fallback → BALANCED (safe default)
 *
 * ❌ PROHIBITED: AI, random(), probabilistic models, external inference
 * ✅ ALLOWED: Matrix lookups, rule-based priority chain, static fallbacks
 *
 * OUTPUT IS ADVISORY ONLY — execution system retains final authority.
 */

import {
  getBestCellForClient,
  mapToLearningClientType,
  type LearningClientType,
  type LearningMatrixSnapshot,
  type LearningStrategy,
} from "./REVENUE_STRATEGY_LEARNING_MATRIX";

export type UrgencyLevel = "low" | "medium" | "high";

export type LearningBiasDirection = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface LearningRecommendation {
  recommendedStrategy: LearningStrategy;
  confidence: number;                   // 0–100 data quality score (NOT a probability)
  reason: string;                       // Human-readable explanation for UI layer
  dataSignals: {
    winRate: number;                    // From best matrix cell
    avgRevenue: number;                 // From best matrix cell
    sampleSize: number;                 // Records backing this recommendation
  };
  // v3.3 new fields
  learningBias: LearningBiasDirection;  // Is data pushing strategy up, down, or neutral?
  basedOn: "historical outcomes";       // Always this value — signals no AI
  fallbackUsed: boolean;                // true if matrix had no reliable cells
  matrixVersion: number;                // Which matrix version drove this
}

// ─── Urgency overrides (only for extreme urgency, applied after matrix check) ─
const URGENCY_OVERRIDE: Partial<Record<UrgencyLevel, LearningStrategy>> = {
  high: "FAST_DEAL", // Speed critical — override even a better-scoring strategy
};

// ─── Static fallbacks by client type (used when matrix is insufficient) ───────
const CLIENT_FALLBACK: Record<LearningClientType, LearningStrategy> = {
  new: "BALANCED",       // Unknown history → safe middle ground
  repeat: "BALANCED",    // Returning client → value relationship first
  long_term: "MAX_REVENUE", // Established trust → maximize value
};

function buildReason(
  strategy: LearningStrategy,
  clientType: LearningClientType,
  urgency: UrgencyLevel,
  winRate: number,
  avgRevenue: number,
  sampleSize: number,
  fallbackUsed: boolean,
  urgencyOverridden: boolean
): string {
  if (fallbackUsed) {
    return `No reliable history yet for ${clientType.replace("_", " ")} clients (need ≥5 resolved deals). Using ${urgency} urgency default: ${strategy}.`;
  }

  const winPct = (winRate * 100).toFixed(0);
  const clientLabel = clientType.replace("_", " ");

  if (urgencyOverridden) {
    return `Urgency is HIGH — switching to FAST_DEAL to maximize close probability. Base data favored a different strategy, but speed takes priority.`;
  }

  const revenueStr = avgRevenue > 0 ? ` averaging $${avgRevenue.toFixed(0)} per won deal` : "";
  return `${strategy} is your strongest strategy for ${clientLabel} clients: ${winPct}% win rate${revenueStr} across ${sampleSize} resolved deals.`;
}

/**
 * getlearningRecommendation — deterministic recommendation from learning matrix.
 *
 * @param clientType  — strategy engine client type ("new" | "repeat" | "long_term")
 *                      OR segment type (will be mapped automatically)
 * @param urgency     — deal urgency
 * @param serviceType — informational only (not used in scoring, reserved for future)
 * @param snapshot    — pre-built LearningMatrixSnapshot (MATRIX_SNAPSHOT source)
 */
export function getLearningRecommendation(
  clientType: string,
  urgency: UrgencyLevel,
  serviceType: string,
  snapshot: LearningMatrixSnapshot
): LearningRecommendation {
  const learningType: LearningClientType = mapToLearningClientType(clientType);
  const best = getBestCellForClient(snapshot, learningType);

  // ── Case 1: No reliable matrix data → fallback ─────────────────────────────
  if (!best) {
    const fallbackStrategy = CLIENT_FALLBACK[learningType];
    return {
      recommendedStrategy: fallbackStrategy,
      confidence: 20,
      reason: buildReason(fallbackStrategy, learningType, urgency, 0, 0, 0, true, false),
      dataSignals: { winRate: 0, avgRevenue: 0, sampleSize: 0 },
      learningBias: fallbackStrategy === "MAX_REVENUE" ? "POSITIVE" : fallbackStrategy === "FAST_DEAL" ? "NEGATIVE" : "NEUTRAL",
      basedOn: "historical outcomes",
      fallbackUsed: true,
      matrixVersion: snapshot.matrixVersion,
    };
  }

  // ── Case 2: Matrix data available — check urgency override ─────────────────
  const urgencyStrategy = URGENCY_OVERRIDE[urgency];
  let urgencyOverridden = false;
  let finalStrategy = best.strategy;

  if (
    urgencyStrategy &&
    urgencyStrategy !== best.strategy &&
    urgency === "high"
  ) {
    // Only apply urgency override if FAST_DEAL has at least 3 samples
    const fastDealCell = snapshot.matrix[learningType].FAST_DEAL;
    if (fastDealCell.sampleSize >= 3) {
      finalStrategy = urgencyStrategy;
      urgencyOverridden = true;
    }
  }

  const activeCell =
    finalStrategy !== best.strategy
      ? snapshot.matrix[learningType][finalStrategy]
      : best.cell;

  // ── Confidence score: weighted by sample size and win rate ─────────────────
  // Max 95 to never claim 100% certainty
  const confidence = Math.min(
    95,
    Math.round(
      Math.min(activeCell.sampleSize / 20, 1) * 50 + // Sample weight: 0–50pts
      activeCell.winRate * 40 +                        // Win rate weight: 0–40pts
      (activeCell.sampleSize >= 10 ? 5 : 0)           // Bonus for solid sample
    )
  );

  return {
    recommendedStrategy: finalStrategy,
    confidence,
    reason: buildReason(
      finalStrategy,
      learningType,
      urgency,
      activeCell.winRate,
      activeCell.avgRevenue,
      activeCell.sampleSize,
      false,
      urgencyOverridden
    ),
    dataSignals: {
      winRate: activeCell.winRate,
      avgRevenue: activeCell.avgRevenue,
      sampleSize: activeCell.sampleSize,
    },
    learningBias: finalStrategy === "MAX_REVENUE" ? "POSITIVE" : finalStrategy === "FAST_DEAL" ? "NEGATIVE" : "NEUTRAL",
    basedOn: "historical outcomes",
    fallbackUsed: false,
    matrixVersion: snapshot.matrixVersion,
  };
}

/**
 * applySoftBias — merge learning recommendation into a base execution strategy.
 * The base strategy is ALWAYS returned unchanged.
 * Learning hint is appended as advisory metadata only.
 *
 * This is the only authorized mutation point — and it does NOT mutate strategy.
 */
export function applySoftBias(
  baseStrategy: LearningStrategy,
  learningHint: LearningRecommendation
): {
  strategy: LearningStrategy;          // UNCHANGED — always = baseStrategy
  learningHint: {
    suggestedStrategy: LearningStrategy;
    confidence: number;
    reason: string;
    aligned: boolean;                  // true if hint agrees with base strategy
    dataSignals: LearningRecommendation["dataSignals"];
    matrixVersion: number;
  };
} {
  return {
    strategy: baseStrategy,  // ← NEVER overridden by learning system
    learningHint: {
      suggestedStrategy: learningHint.recommendedStrategy,
      confidence: learningHint.confidence,
      reason: learningHint.reason,
      aligned: learningHint.recommendedStrategy === baseStrategy,
      dataSignals: learningHint.dataSignals,
      matrixVersion: learningHint.matrixVersion,
    },
  };
}
