/**
 * REVENUE_EXPERIMENT_SCALER.ts — v3.5 Experiment Auto-Scaler
 *
 * Checks strategy A/B test results and scales strategy exposures based on statistical thresholds.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Rules-based checking, score classification, deterministic state adjustments
 */

export interface ExperimentResult {
  strategy: string;
  exposureRate: number;        // e.g. 20 (representing 20%)
  winRate: number;
  avgRevenue: number;
  controlWinRate: number;       // win rate of control (BALANCED)
  sampleSize: number;
}

export interface ScalerOutput {
  scaleUp: string[];            // Strategies to increase exposure for
  scaleDown: string[];          // Strategies to reduce exposure for
  stopExperiments: string[];    // Strategies to cease testing (extreme underperformance)
  decisionsSummary: Record<string, { winRateDelta: number; action: "NONE" | "SCALE_UP" | "SCALE_DOWN" | "STOP" }>;
}

const MIN_SAMPLE_SIZE = 10;
const TIGHT_CONFIDENCE_DIFF = 0.15; // 15% difference triggers scale adjustment

/**
 * runExperimentScaling — evaluates testing results to scale exposures.
 */
export function runExperimentScaling(results: ExperimentResult[]): ScalerOutput {
  const scaleUp: string[] = [];
  const scaleDown: string[] = [];
  const stopExperiments: string[] = [];
  const decisionsSummary: ScalerOutput["decisionsSummary"] = {};

  for (const r of results) {
    const winRateDelta = r.winRate - r.controlWinRate;
    let action: "NONE" | "SCALE_UP" | "SCALE_DOWN" | "STOP" = "NONE";

    // Only make decisions once sample size is sufficient
    if (r.sampleSize >= MIN_SAMPLE_SIZE) {
      if (winRateDelta >= TIGHT_CONFIDENCE_DIFF && r.exposureRate < 50) {
        scaleUp.push(r.strategy);
        action = "SCALE_UP";
      } else if (winRateDelta <= -TIGHT_CONFIDENCE_DIFF) {
        if (winRateDelta <= -0.25 || r.sampleSize > 25) {
          stopExperiments.push(r.strategy);
          action = "STOP";
        } else if (r.exposureRate > 10) {
          scaleDown.push(r.strategy);
          action = "SCALE_DOWN";
        }
      }
    }

    decisionsSummary[r.strategy] = {
      winRateDelta: parseFloat(winRateDelta.toFixed(3)),
      action,
    };
  }

  return {
    scaleUp,
    scaleDown,
    stopExperiments,
    decisionsSummary,
  };
}
