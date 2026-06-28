import {
  validateDecisionConsistency,
  type ConsistencyAction,
  type DecisionConsistencyInput,
  type MismatchSeverity,
} from './validateDecisionConsistency';

export type DecisionDiffCase = {
  step: string;
  sim_action: ConsistencyAction;
  live_action: ConsistencyAction;
  severity: 'low' | 'high';
};

export type DecisionDiffReport = {
  mismatch_count: number;
  mismatch_cases: DecisionDiffCase[];
};

function normalizeAction(value: unknown): ConsistencyAction {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'block' || normalized === 'upsell' || normalized === 'soft_paywall' || normalized === 'redirect') {
    return normalized;
  }
  return 'allow';
}

function readStep(result: DecisionConsistencyInput, index: number) {
  return String(result.step || `step_${index + 1}`);
}

function toDiffSeverity(severity: MismatchSeverity): 'low' | 'high' {
  return severity === 'high' ? 'high' : 'low';
}

export function buildDiffReport(
  simulationResults: DecisionConsistencyInput[] = [],
  controlPlaneResults: DecisionConsistencyInput[] = [],
): DecisionDiffReport {
  const maxLength = Math.max(simulationResults.length, controlPlaneResults.length);
  const mismatchCases: DecisionDiffCase[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const simulation = simulationResults[index] ?? {};
    const controlPlane = controlPlaneResults[index] ?? {};
    const result = validateDecisionConsistency(simulation, controlPlane);

    if (!result.isValid) {
      mismatchCases.push({
        step: readStep(simulation.step ? simulation : controlPlane, index),
        sim_action: normalizeAction(simulation.decision_action ?? simulation.action ?? simulation.backend_action),
        live_action: normalizeAction(controlPlane.decision_action ?? controlPlane.action ?? controlPlane.backend_action ?? controlPlane.decision),
        severity: toDiffSeverity(result.mismatchSeverity),
      });
    }
  }

  return {
    mismatch_count: mismatchCases.length,
    mismatch_cases: mismatchCases,
  };
}
