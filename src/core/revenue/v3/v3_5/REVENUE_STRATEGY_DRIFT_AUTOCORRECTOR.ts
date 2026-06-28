/**
 * REVENUE_STRATEGY_DRIFT_AUTOCORRECTOR.ts — v3.5 Drift Autocorrector
 *
 * Compares short-term outcome win rates (recent 10 deals) vs long-term baseline (past 50 deals)
 * to detect strategy effectiveness drift and apply corrections.
 *
 * ❌ PROHIBITED: AI, random(), direct execution mutation
 * ✅ ALLOWED: Sliding window analysis, delta calculation, weight adjustment output
 */

export interface DriftOutcomeRecord {
  strategy_used: string;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  timestamp: number;
}

export interface DriftAdjustment {
  strategy: string;
  delta: number;
}

export interface DriftCorrectorOutput {
  correctionApplied: boolean;
  adjustments: DriftAdjustment[];
  driftMetrics: Record<string, { shortTermWinRate: number; longTermWinRate: number; driftScore: number }>;
}

const SHORT_WINDOW = 10;
const LONG_WINDOW = 50;
const DRIFT_THRESHOLD = -0.20; // 20% drops trigger corrections

/**
 * runDriftAutocorrect — runs drift checks on outcome records.
 */
export function runDriftAutocorrect(records: DriftOutcomeRecord[]): DriftCorrectorOutput {
  const resolved = records
    .filter((r) => r.outcome === "WON" || r.outcome === "LOST")
    .sort((a, b) => b.timestamp - a.timestamp); // Sort descending (newest first)

  const adjustments: DriftAdjustment[] = [];
  const driftMetrics: DriftCorrectorOutput["driftMetrics"] = {};
  let correctionApplied = false;

  const strategies = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];

  for (const strategy of strategies) {
    const stratRecords = resolved.filter((r) => r.strategy_used === strategy);

    if (stratRecords.length < 15) {
      // Insufficient sample size to detect drift
      driftMetrics[strategy] = { shortTermWinRate: 0, longTermWinRate: 0, driftScore: 0 };
      continue;
    }

    const shortTerm = stratRecords.slice(0, SHORT_WINDOW);
    const longTerm = stratRecords.slice(0, LONG_WINDOW);

    const shortWon = shortTerm.filter((r) => r.outcome === "WON").length;
    const shortWinRate = shortWon / shortTerm.length;

    const longWon = longTerm.filter((r) => r.outcome === "WON").length;
    const longWinRate = longWon / longTerm.length;

    const driftScore = shortWinRate - longWinRate;

    driftMetrics[strategy] = {
      shortTermWinRate: parseFloat(shortWinRate.toFixed(3)),
      longTermWinRate: parseFloat(longWinRate.toFixed(3)),
      driftScore: parseFloat(driftScore.toFixed(3)),
    };

    // If performance dropped significantly below baseline
    if (driftScore <= DRIFT_THRESHOLD) {
      correctionApplied = true;
      adjustments.push({
        strategy,
        delta: Math.round(driftScore * 50), // Scale to integer weight adjustment (e.g. -15)
      });
    }
  }

  // Ensure sum of adjustments equals 0 by distributing positive offset to stable strategies
  if (correctionApplied && adjustments.length > 0) {
    const totalNegativeDelta = adjustments.reduce((sum, adj) => sum + adj.delta, 0);
    const stableStrats = strategies.filter((s) => !adjustments.some((adj) => adj.strategy === s));

    if (stableStrats.length > 0) {
      const positiveOffset = Math.round(-totalNegativeDelta / stableStrats.length);
      for (const stable of stableStrats) {
        adjustments.push({
          strategy: stable,
          delta: positiveOffset,
        });
      }
    }
  }

  return {
    correctionApplied,
    adjustments,
    driftMetrics,
  };
}
