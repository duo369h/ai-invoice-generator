/**
 * RDCL v3.3 — Production Readiness Scorer
 *
 * Aggregates outputs from all reliability modules into a single production
 * readiness verdict with a normalized score and explicit blocker list.
 *
 * Score formula (weighted):
 *   determinism   → 40% weight (non-negotiable for RDCL)
 *   stability     → 30% weight
 *   anomaly rate  → 20% weight
 *   safety        → 10% weight
 */

import { StabilityReport } from './stability-engine';
import { AnomalyReport } from './anomaly-detector';
import { RegressionReport } from './regression-suite';
import { LoadTestResult } from './load-test-engine';

export interface ReadinessReport {
  rdcl_production_ready: boolean;
  score: number; // 0.0 – 1.0
  blockers: string[];
  breakdown: {
    determinism_score: number;
    stability_score:   number;
    anomaly_score:     number;
    safety_score:      number;
  };
}

// ── Score weights ─────────────────────────────────────────────────────────────

const WEIGHTS = {
  determinism: 0.40,
  stability:   0.30,
  anomaly:     0.20,
  safety:      0.10,
} as const;

// ── Thresholds for production gate ────────────────────────────────────────────

const THRESHOLDS = {
  MIN_SCORE:            0.85,
  MAX_ANOMALY_RATE:     0.05,
  MIN_STABILITY_SCORE:  0.95, // average across scenarios
  REGRESSION_TOLERANCE: 0,    // zero failures allowed
};

// ── Sub-scorers ───────────────────────────────────────────────────────────────

function scoreDeterminism(stability: StabilityReport): number {
  // Binary: RDCL is deterministic or it isn't
  return stability.deterministic ? 1.0 : 0.0;
}

function scoreStability(loadResults: LoadTestResult[]): number {
  if (loadResults.length === 0) return 0.0;
  const avg = loadResults.reduce((s, r) => s + r.stability_score, 0) / loadResults.length;
  return parseFloat(avg.toFixed(4));
}

function scoreAnomaly(anomaly: AnomalyReport): number {
  // No anomalies = 1.0; severity degrades the score
  if (anomaly.anomalies.length === 0) return 1.0;
  switch (anomaly.severity) {
    case 'low':    return 0.85;
    case 'medium': return 0.60;
    case 'high':   return 0.20;
  }
}

function scoreSafety(regression: RegressionReport): number {
  // Safety proxy: regression suite passes TC-06 (safety layer test)
  const safetyFailed = regression.failed_cases.some(c => c.includes('TC-06'));
  return safetyFailed ? 0.0 : 1.0;
}

// ── Blocker derivation ────────────────────────────────────────────────────────

function deriveBlockers(
  determinismScore: number,
  stabilityScore:   number,
  anomalyReport:    AnomalyReport,
  regressionReport: RegressionReport,
  finalScore:       number
): string[] {
  const blockers: string[] = [];

  if (determinismScore < 1.0) {
    blockers.push('BLOCKER: RDCL is non-deterministic — same input must always produce same output');
  }

  if (stabilityScore < THRESHOLDS.MIN_STABILITY_SCORE) {
    blockers.push(
      `BLOCKER: Stability score ${stabilityScore.toFixed(4)} is below minimum ${THRESHOLDS.MIN_STABILITY_SCORE}`
    );
  }

  if (anomalyReport.severity === 'high') {
    blockers.push(`BLOCKER: High-severity anomalies detected — ${anomalyReport.anomalies.length} issue(s)`);
  }

  if (regressionReport.failed_cases.length > THRESHOLDS.REGRESSION_TOLERANCE) {
    blockers.push(
      `BLOCKER: ${regressionReport.failed_cases.length} regression test(s) failed:\n` +
      regressionReport.failed_cases.map(f => `  • ${f}`).join('\n')
    );
  }

  if (finalScore < THRESHOLDS.MIN_SCORE) {
    blockers.push(
      `BLOCKER: Final readiness score ${finalScore.toFixed(4)} is below minimum ${THRESHOLDS.MIN_SCORE}`
    );
  }

  return blockers;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function computeReadiness(
  loadResults:    LoadTestResult[],
  stability:      StabilityReport,
  anomaly:        AnomalyReport,
  regression:     RegressionReport
): ReadinessReport {
  const determinism_score = scoreDeterminism(stability);
  const stability_score   = scoreStability(loadResults);
  const anomaly_score     = scoreAnomaly(anomaly);
  const safety_score      = scoreSafety(regression);

  const score = parseFloat((
    determinism_score * WEIGHTS.determinism +
    stability_score   * WEIGHTS.stability   +
    anomaly_score     * WEIGHTS.anomaly     +
    safety_score      * WEIGHTS.safety
  ).toFixed(4));

  const blockers = deriveBlockers(
    determinism_score,
    stability_score,
    anomaly,
    regression,
    score
  );

  return {
    rdcl_production_ready: blockers.length === 0,
    score,
    blockers,
    breakdown: {
      determinism_score,
      stability_score,
      anomaly_score,
      safety_score,
    },
  };
}
