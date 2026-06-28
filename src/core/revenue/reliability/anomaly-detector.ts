/**
 * RDCL v3.3 — Runtime Decision Anomaly Detector
 *
 * Flags any deviation from the canonical decision flow:
 *   Event → Context → RDCL → Action
 *
 * Detects: action flips, conflicting UI triggers, monetization spikes,
 * inconsistent RDCL outputs, and abnormal latency patterns.
 *
 * RULE: Observational only. No changes to RDCL or any other module.
 */

import { LoadTestResult, Action } from './load-test-engine';
import { StabilityReport } from './stability-engine';

export type AnomalySeverity = 'low' | 'medium' | 'high';

export interface AnomalyReport {
  anomalies: string[];
  severity: AnomalySeverity;
}

// ── Anomaly thresholds ────────────────────────────────────────────────────────

const THRESHOLDS = {
  /** Max acceptable p99 latency in ms for a single RDCL call */
  MAX_LATENCY_MS: 5,
  /** Maximum fraction of non-modal decisions before flagging instability */
  MAX_DRIFT_FRACTION: 0.05,
  /** Maximum number of SHOW_UPGRADE decisions in a single trace before flagging spam */
  MAX_UPGRADE_SPIKE: 5,
  /** Minimum stability_score before triggering high-severity alert */
  MIN_STABILITY_SCORE: 0.95,
};

// ── Detectors ─────────────────────────────────────────────────────────────────

function detectActionFlips(result: LoadTestResult): string[] {
  const flags: string[] = [];
  const trace = result.decision_trace;

  for (let i = 1; i < trace.length; i++) {
    const prev = trace[i - 1];
    const curr = trace[i];
    // A flip is a change from a high-confidence action back to NO_ACTION or vice-versa
    if (
      (prev === 'UNLOCK_PREMIUM' && curr === 'NO_ACTION') ||
      (prev === 'SHOW_UPGRADE'   && curr === 'NO_ACTION') ||
      (prev === 'NO_ACTION'      && curr === 'LIMIT_USAGE')
    ) {
      flags.push(
        `ACTION FLIP in "${result.scenario}" at step ${i}: ${prev} → ${curr}`
      );
    }
  }

  return flags;
}

function detectMonetizationSpike(result: LoadTestResult): string[] {
  const flags: string[] = [];
  const upgradeCount = result.decision_trace.filter(a => a === 'SHOW_UPGRADE').length;

  if (upgradeCount > THRESHOLDS.MAX_UPGRADE_SPIKE) {
    flags.push(
      `MONETIZATION SPIKE in "${result.scenario}": SHOW_UPGRADE triggered ${upgradeCount} times (max=${THRESHOLDS.MAX_UPGRADE_SPIKE})`
    );
  }

  return flags;
}

function detectLatencyAnomaly(result: LoadTestResult): string[] {
  const flags: string[] = [];
  const { latency } = result;

  if (latency.length === 0) return flags;

  const p99 = [...latency].sort((a, b) => a - b)[Math.floor(latency.length * 0.99)];
  if (p99 > THRESHOLDS.MAX_LATENCY_MS) {
    flags.push(
      `LATENCY ANOMALY in "${result.scenario}": p99=${p99.toFixed(3)}ms exceeds threshold of ${THRESHOLDS.MAX_LATENCY_MS}ms`
    );
  }

  return flags;
}

function detectStabilityDrop(result: LoadTestResult): string[] {
  if (result.stability_score < THRESHOLDS.MIN_STABILITY_SCORE) {
    return [
      `STABILITY DROP in "${result.scenario}": score=${result.stability_score} (min=${THRESHOLDS.MIN_STABILITY_SCORE})`
    ];
  }
  return [];
}

function detectInconsistentOutputs(stabilityReport: StabilityReport): string[] {
  // Any failure_points from the stability engine are directly anomalies
  return stabilityReport.failure_points.map(fp => `INCONSISTENT OUTPUT: ${fp}`);
}

// ── Severity calculator ───────────────────────────────────────────────────────

function computeSeverity(anomalies: string[]): AnomalySeverity {
  if (anomalies.length === 0) return 'low';

  const hasHigh = anomalies.some(
    a =>
      a.includes('MONETIZATION SPIKE') ||
      a.includes('INCONSISTENT OUTPUT') ||
      a.includes('STABILITY DROP')
  );
  if (hasHigh) return 'high';

  const hasMedium = anomalies.some(
    a => a.includes('ACTION FLIP') || a.includes('LATENCY ANOMALY')
  );
  if (hasMedium) return 'medium';

  return 'low';
}

// ── Public API ────────────────────────────────────────────────────────────────

export function detectAnomalies(
  loadResults: LoadTestResult[],
  stabilityReport: StabilityReport
): AnomalyReport {
  const anomalies: string[] = [];

  for (const result of loadResults) {
    anomalies.push(...detectActionFlips(result));
    anomalies.push(...detectMonetizationSpike(result));
    anomalies.push(...detectLatencyAnomaly(result));
    anomalies.push(...detectStabilityDrop(result));
  }

  anomalies.push(...detectInconsistentOutputs(stabilityReport));

  return {
    anomalies,
    severity: computeSeverity(anomalies),
  };
}
