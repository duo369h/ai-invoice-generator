/**
 * RDCL v3.3 — Hard Production Gate (CRITICAL)
 *
 * The final enforcement checkpoint before RDCL enters production traffic.
 * System CANNOT proceed if ANY of the following are true:
 *
 *   ✗ anomaly_rate > 0.05
 *   ✗ determinism < 1.0
 *   ✗ safety layer violated (TC-06 failed)
 *   ✗ regression suite has failures
 *   ✗ rdcl_production_ready === false
 *
 * RULE: Throws on failure. Returns true only when all conditions pass.
 * Caller must handle the thrown Error and halt deployment.
 */

import { ReadinessReport } from './readiness-scorer';
import { StabilityReport }  from './stability-engine';
import { AnomalyReport }    from './anomaly-detector';
import { RegressionReport } from './regression-suite';

// ── Gate conditions ───────────────────────────────────────────────────────────

const GATE_THRESHOLDS = {
  MAX_ANOMALY_RATE:     0.05,
  MIN_DETERMINISM:      1.0,
  MAX_REGRESSION_FAILS: 0,
} as const;

// ── Individual condition checkers ─────────────────────────────────────────────

function checkAnomalyRate(anomaly: AnomalyReport, stability: StabilityReport): void {
  const rate = stability.deviation_rate;
  if (rate > GATE_THRESHOLDS.MAX_ANOMALY_RATE) {
    throw new Error(
      `PRODUCTION GATE BLOCKED: anomaly_rate=${rate} exceeds threshold=${GATE_THRESHOLDS.MAX_ANOMALY_RATE}`
    );
  }
}

function checkDeterminism(stability: StabilityReport): void {
  if (!stability.deterministic) {
    throw new Error(
      `PRODUCTION GATE BLOCKED: RDCL is non-deterministic. ` +
      `Failures:\n${stability.failure_points.map(f => `  • ${f}`).join('\n')}`
    );
  }
}

function checkSafetyLayer(regression: RegressionReport): void {
  const safetyViolation = regression.failed_cases.find(c => c.includes('TC-06'));
  if (safetyViolation) {
    throw new Error(
      `PRODUCTION GATE BLOCKED: Safety layer violation detected.\n  • ${safetyViolation}`
    );
  }
}

function checkRegressionSuite(regression: RegressionReport): void {
  if (regression.failed_cases.length > GATE_THRESHOLDS.MAX_REGRESSION_FAILS) {
    throw new Error(
      `PRODUCTION GATE BLOCKED: ${regression.failed_cases.length} regression test(s) failed:\n` +
      regression.failed_cases.map(f => `  • ${f}`).join('\n')
    );
  }
}

function checkReadinessReport(report: ReadinessReport): void {
  if (!report.rdcl_production_ready) {
    throw new Error(
      `RDCL NOT SAFE FOR PRODUCTION.\n` +
      `Score: ${report.score}\n` +
      `Blockers:\n${report.blockers.map(b => `  • ${b}`).join('\n')}`
    );
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Hard production gate — ALL conditions must pass or this throws.
 *
 * @param report     - Output from readiness-scorer.computeReadiness()
 * @param stability  - Output from stability-engine.runStabilityEngine()
 * @param anomaly    - Output from anomaly-detector.detectAnomalies()
 * @param regression - Output from regression-suite.runRegressionSuite()
 * @returns true if all checks pass (safe to proceed)
 * @throws Error with specific blocker message on any failure
 */
export function productionGate(
  report:     ReadinessReport,
  stability:  StabilityReport,
  anomaly:    AnomalyReport,
  regression: RegressionReport
): true {
  // Execute all checks in priority order — first failure throws immediately
  checkDeterminism(stability);
  checkSafetyLayer(regression);
  checkRegressionSuite(regression);
  checkAnomalyRate(anomaly, stability);
  checkReadinessReport(report);

  console.info(
    `[RDCL PRODUCTION GATE] ✓ PASSED — score=${report.score}, ` +
    `deterministic=${stability.deterministic}, anomalies=${anomaly.anomalies.length}`
  );

  return true;
}

/**
 * Non-throwing variant — returns a result object instead of throwing.
 * Use for reporting and dashboards. Use productionGate() for hard enforcement.
 */
export function productionGateSafe(
  report:     ReadinessReport,
  stability:  StabilityReport,
  anomaly:    AnomalyReport,
  regression: RegressionReport
): { passed: boolean; error: string | null } {
  try {
    productionGate(report, stability, anomaly, regression);
    return { passed: true, error: null };
  } catch (e) {
    return { passed: false, error: (e as Error).message };
  }
}
