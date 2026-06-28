/**
 * REVENUE_FEEDBACK_INTELLIGENCE.ts — v3.1.2 Master Aggregator
 *
 * Central entry point for the Revenue Feedback Intelligence Layer.
 * Wires together: OutcomeEngine + StrategyAnalyzer + SegmentEngine
 *
 * Called by: UI layer, API routes — NEVER by AI decision modules.
 *
 * ❌ AI PROHIBITED from calling this in a request/response cycle.
 * ✅ ALLOWED: async/offline reads, UI display, admin dashboards.
 */

import { recordOutcome, updateOutcome, computeOutcomeStats } from "./REVENUE_OUTCOME_ENGINE";
import { analyzeStrategyPerformance } from "./STRATEGY_PERFORMANCE_ANALYZER";
import { getSegmentProfile } from "./USER_SEGMENT_ENGINE";
import type { RevenueOutcomeRecord, OutcomeResult } from "./REVENUE_OUTCOME_ENGINE";

export type { RevenueOutcomeRecord, OutcomeResult };

export interface FeedbackIntelligenceSnapshot {
  userId: string;
  overallStats: ReturnType<typeof computeOutcomeStats>;
  strategyAnalysis: ReturnType<typeof analyzeStrategyPerformance>;
  segmentProfile: ReturnType<typeof getSegmentProfile>;
  topInsight: string;           // Single actionable insight for the UI
  systemStatus: "cold" | "learning" | "calibrated";
  snapshotAt: number;
}

/**
 * buildFeedbackSnapshot — compute the full intelligence snapshot for a user.
 * ASYNC-SAFE: intended for background jobs and UI loads, not hot paths.
 */
export function buildFeedbackSnapshot(
  userId: string,
  basePrice: number
): FeedbackIntelligenceSnapshot {
  const overallStats = computeOutcomeStats(userId);
  const strategyAnalysis = analyzeStrategyPerformance(userId);
  const segmentProfile = getSegmentProfile(userId, basePrice);

  const topInsight = deriveTopInsight(overallStats, strategyAnalysis, segmentProfile);

  return {
    userId,
    overallStats,
    strategyAnalysis,
    segmentProfile,
    topInsight,
    systemStatus: overallStats.learningConfidence,
    snapshotAt: Date.now(),
  };
}

function deriveTopInsight(
  stats: ReturnType<typeof computeOutcomeStats>,
  strategy: ReturnType<typeof analyzeStrategyPerformance>,
  segment: ReturnType<typeof getSegmentProfile>
): string {
  if (stats.learningConfidence === "cold") {
    return "Complete your first few deals so the system can start learning your pricing patterns.";
  }

  if (stats.winRate < 0.3 && stats.totalRecords >= 5) {
    return `Your current win rate is ${(stats.winRate * 100).toFixed(0)}%. Consider switching to FAST_DEAL strategy for the next 3 clients to improve close rate.`;
  }

  if (strategy.topStrategy && strategy.rankedStrategies[0]?.winRate > 0.6) {
    return `${strategy.topStrategy} is your top strategy with a ${(strategy.rankedStrategies[0].winRate * 100).toFixed(0)}% win rate. Keep using it for ${segment.segment.replace("_", " ").toLowerCase()} clients.`;
  }

  if (stats.priceConversionRatio < 0.85) {
    return `You're accepting ${(stats.priceConversionRatio * 100).toFixed(0)}% of your offered price on average. Try anchoring higher with BALANCED strategy.`;
  }

  return `System is calibrated. Your ${segment.segment.replace("_", " ")} clients respond best to prices between $${segment.recommendedPriceBand.min}–$${segment.recommendedPriceBand.max}.`;
}

// ─── Re-export core actions for convenience ──────────────────────────────
export { recordOutcome, updateOutcome, computeOutcomeStats };
export { analyzeStrategyPerformance };
export { getSegmentProfile };
