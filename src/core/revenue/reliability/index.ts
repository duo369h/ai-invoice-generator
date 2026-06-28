/**
 * RDCL v3.3 — Revenue Reliability Layer
 *
 * Public API surface for the production stability engine.
 * Import from this index — do not import individual modules directly.
 *
 * Usage (full pipeline):
 *
 *   import { runLoadTest, runStabilityEngine, detectAnomalies,
 *            runRegressionSuite, computeReadiness, productionGate } from './reliability';
 *
 *   const loadResults  = runLoadTest();
 *   const stability    = runStabilityEngine(loadResults);
 *   const anomaly      = detectAnomalies(loadResults, stability);
 *   const regression   = runRegressionSuite();
 *   const readiness    = computeReadiness(loadResults, stability, anomaly, regression);
 *   productionGate(readiness, stability, anomaly, regression); // throws if not safe
 */

export { runLoadTest }                          from './load-test-engine';
export type { LoadTestResult, Action }          from './load-test-engine';

export { runStabilityEngine, validateLoadResults } from './stability-engine';
export type { StabilityReport }                 from './stability-engine';

export { detectAnomalies }                      from './anomaly-detector';
export type { AnomalyReport, AnomalySeverity }  from './anomaly-detector';

export { applySafetyLayer, filterTrace, resetSafetySession } from './safety-layer';
export type { SafetyDecision }                  from './safety-layer';

export { runRegressionSuite }                   from './regression-suite';
export type { RegressionReport }                from './regression-suite';

export { computeReadiness }                     from './readiness-scorer';
export type { ReadinessReport }                 from './readiness-scorer';

export { productionGate, productionGateSafe }   from './production-gate';
