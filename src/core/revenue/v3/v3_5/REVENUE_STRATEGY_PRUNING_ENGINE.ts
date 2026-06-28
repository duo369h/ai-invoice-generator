/**
 * REVENUE_STRATEGY_PRUNING_ENGINE.ts — v3.5 Strategy Pruning Engine
 *
 * Identifies and flags strategies that are performing poorly in the market.
 *
 * ❌ PROHIBITED: AI, random(), direct mutations
 * ✅ ALLOWED: Rules-based checking, score classification, advisory output
 *
 * Rules:
 *   1. IF winRate < 30% AND sampleSize > 20 → CANDIDATE_FOR_REMOVAL
 *   2. IF revenueContribution < 10% AND totalRevenue > 0 → DOWNGRADED (weight reduction)
 */

export interface StrategyPruneMetric {
  strategy: string;
  winRate: number;
  sampleSize: number;
  totalAcceptedRevenue: number;
}

export interface PruningOutput {
  prunedStrategies: string[];       // Candidates for removal due to low win rates
  downgradedStrategies: string[];   // Candidates for down-weighting due to low revenue contribution
  metricsSummary: Record<string, { winRate: number; revenueSharePct: number; action: "NONE" | "PRUNE" | "DOWNGRADE" }>;
}

/**
 * runStrategyPruning — checks all strategies against win-rate and revenue thresholds.
 */
export function runStrategyPruning(
  metrics: StrategyPruneMetric[],
  minContributionThreshold = 0.10
): PruningOutput {
  const prunedStrategies: string[] = [];
  const downgradedStrategies: string[] = [];
  const metricsSummary: PruningOutput["metricsSummary"] = {};

  const totalSystemRevenue = metrics.reduce((sum, m) => sum + m.totalAcceptedRevenue, 0);

  for (const m of metrics) {
    const revenueShare = totalSystemRevenue > 0 ? m.totalAcceptedRevenue / totalSystemRevenue : 0;
    const revenueSharePct = parseFloat((revenueShare * 100).toFixed(1));

    let action: "NONE" | "PRUNE" | "DOWNGRADE" = "NONE";

    // 1️⃣ Check low win-rate removal threshold
    if (m.winRate < 0.30 && m.sampleSize > 20) {
      prunedStrategies.push(m.strategy);
      action = "PRUNE";
    }

    // 2️⃣ Check low revenue contribution down-weight threshold
    if (revenueShare < minContributionThreshold && totalSystemRevenue > 0) {
      // Only downgrade if not already marked for pruning
      if (action !== "PRUNE") {
        downgradedStrategies.push(m.strategy);
        action = "DOWNGRADE";
      }
    }

    metricsSummary[m.strategy] = {
      winRate: m.winRate,
      revenueSharePct,
      action,
    };
  }

  return {
    prunedStrategies,
    downgradedStrategies,
    metricsSummary,
  };
}
