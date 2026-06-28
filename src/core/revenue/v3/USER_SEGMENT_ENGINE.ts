/**
 * OBSERVABILITY ONLY
 * DO NOT USE FOR DECISION MAKING
 *
 * USER_SEGMENT_ENGINE.ts — v3.1.2 Client Behavioral Segmentation
 *
 * Groups users/clients into behavioral segments based on REAL decision patterns.
 * Segments drive personalized price bands — NOT AI-inferred stereotypes.
 *
 * ❌ AI PROHIBITED: Segmentation is rule-based and data-driven only.
 * ✅ ALLOWED: Score-based bucketing, history-weighted classification.
 */

import { getOutcomesByUser, type RevenueOutcomeRecord } from "./REVENUE_OUTCOME_ENGINE";

export type UserSegment =
  | "PRICE_SENSITIVE"    // Often rejects, edits quotes down
  | "VALUE_SEEKER"       // Balances price and scope
  | "FAST_CLOSER"        // Accepts quickly without revision
  | "HIGH_VALUE"         // Accepts high prices, enterprise behavior
  | "UNKNOWN";           // Insufficient data

export interface SegmentProfile {
  userId: string;
  segment: UserSegment;
  score: number;                  // 0–100 confidence in segment assignment
  behaviorSignals: {
    avgRevisionCount: number;
    avgTimeToDecisionHours: number;
    avgAcceptedPriceRatio: number; // accepted / offered
    winRate: number;
  };
  recommendedPriceBand: {
    min: number;
    max: number;
    anchor: number;
  };
  segmentNote: string;
}

const PRICE_BAND_MULTIPLIERS: Record<UserSegment, { min: number; max: number; anchor: number }> = {
  PRICE_SENSITIVE: { min: 0.7, max: 0.85, anchor: 0.78 },
  VALUE_SEEKER:    { min: 0.85, max: 1.1, anchor: 0.95 },
  FAST_CLOSER:     { min: 0.95, max: 1.15, anchor: 1.05 },
  HIGH_VALUE:      { min: 1.1, max: 1.4, anchor: 1.25 },
  UNKNOWN:         { min: 0.85, max: 1.1, anchor: 1.0 },
};

function computeSegment(
  records: RevenueOutcomeRecord[]
): { segment: UserSegment; score: number; signals: SegmentProfile["behaviorSignals"] } {
  if (records.length < 2) {
    return {
      segment: "UNKNOWN",
      score: 0,
      signals: {
        avgRevisionCount: 0,
        avgTimeToDecisionHours: 0,
        avgAcceptedPriceRatio: 0,
        winRate: 0,
      },
    };
  }

  const resolved = records.filter((r) => r.outcome !== "PENDING");
  const won = resolved.filter((r) => r.outcome === "WON");

  const avgRevisionCount =
    resolved.length > 0
      ? resolved.reduce((s, r) => s + r.revision_count, 0) / resolved.length
      : 0;

  const avgTimeToDecisionHours =
    won.length > 0
      ? won.reduce((s, r) => s + (r.time_to_decision_hours ?? 24), 0) / won.length
      : 24;

  const avgAcceptedPriceRatio =
    won.length > 0
      ? won.reduce((s, r) => s + (r.price_accepted ?? 0) / r.price_offered, 0) / won.length
      : 0;

  const winRate = resolved.length > 0 ? won.length / resolved.length : 0;

  // Scoring heuristics (deterministic rules, no AI)
  let segment: UserSegment = "VALUE_SEEKER";
  let score = 60;

  if (avgAcceptedPriceRatio > 1.05 && winRate > 0.6) {
    segment = "HIGH_VALUE";
    score = Math.min(95, 60 + records.length * 2);
  } else if (avgTimeToDecisionHours < 8 && avgRevisionCount < 1 && winRate > 0.55) {
    segment = "FAST_CLOSER";
    score = Math.min(90, 55 + records.length * 2);
  } else if (avgAcceptedPriceRatio < 0.85 || avgRevisionCount > 2) {
    segment = "PRICE_SENSITIVE";
    score = Math.min(85, 50 + records.length * 2);
  } else if (winRate > 0.4 && avgRevisionCount < 2) {
    segment = "VALUE_SEEKER";
    score = Math.min(80, 55 + records.length);
  }

  return {
    segment,
    score,
    signals: {
      avgRevisionCount,
      avgTimeToDecisionHours,
      avgAcceptedPriceRatio,
      winRate,
    },
  };
}

function buildSegmentNote(segment: UserSegment, signals: SegmentProfile["behaviorSignals"]): string {
  switch (segment) {
    case "HIGH_VALUE":
      return `This client type accepts premium prices (avg ${(signals.avgAcceptedPriceRatio * 100).toFixed(0)}% of offered). Lead with your full rate.`;
    case "FAST_CLOSER":
      return `Closes quickly (avg ${signals.avgTimeToDecisionHours.toFixed(1)}h). Minimize scope uncertainty and they'll commit.`;
    case "PRICE_SENSITIVE":
      return `Frequently revises or rejects. Start closer to your minimum viable rate and build from there.`;
    case "VALUE_SEEKER":
      return `Balanced buyer. Emphasize deliverable quality and timeline certainty over raw price.`;
    default:
      return `Not enough history yet. Default pricing bands applied.`;
  }
}

/**
 * getSegmentProfile — compute behavioral segment for a user from their outcome history.
 */
export function getSegmentProfile(userId: string, basePrice: number): SegmentProfile {
  const records = getOutcomesByUser(userId);
  const { segment, score, signals } = computeSegment(records);
  const multipliers = PRICE_BAND_MULTIPLIERS[segment];

  return {
    userId,
    segment,
    score,
    behaviorSignals: signals,
    recommendedPriceBand: {
      min: Math.round(basePrice * multipliers.min),
      max: Math.round(basePrice * multipliers.max),
      anchor: Math.round(basePrice * multipliers.anchor),
    },
    segmentNote: buildSegmentNote(segment, signals),
  };
}
