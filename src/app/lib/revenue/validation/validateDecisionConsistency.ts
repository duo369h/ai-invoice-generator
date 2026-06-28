export type ConsistencyAction = 'allow' | 'block' | 'upsell' | 'soft_paywall' | 'redirect';
export type MismatchSeverity = 'low' | 'medium' | 'high';

export type PricingInfluence = {
  triggered?: boolean;
  trigger?: string;
  pricing_viewed?: boolean;
  pricing_view_count?: number;
  pricing_change?: number;
};

export type DecisionConsistencyInput = {
  step?: string;
  action?: ConsistencyAction;
  decision_action?: ConsistencyAction;
  backend_action?: ConsistencyAction;
  backendAction?: ConsistencyAction;
  decision?: ConsistencyAction;
  intent_score?: number;
  pricing_trigger_attribution?: PricingInfluence;
  pricingTriggerAttribution?: PricingInfluence;
  export_triggered?: boolean;
  reason_chain?: string[];
};

export type DecisionConsistencyResult = {
  isValid: boolean;
  mismatches: string[];
  mismatchSeverity: MismatchSeverity;
};

const VALID_ACTIONS = new Set<ConsistencyAction>(['allow', 'block', 'upsell', 'soft_paywall', 'redirect']);

function normalizeAction(value: unknown): ConsistencyAction | null {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_ACTIONS.has(normalized as ConsistencyAction) ? normalized as ConsistencyAction : null;
}

function readAction(result: DecisionConsistencyInput): ConsistencyAction {
  return normalizeAction(result.action)
    ?? normalizeAction(result.decision_action)
    ?? normalizeAction(result.backend_action)
    ?? normalizeAction(result.backendAction)
    ?? normalizeAction(result.decision)
    ?? 'allow';
}

function readIntentScore(result: DecisionConsistencyInput) {
  const score = Number(result.intent_score ?? 0);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
}

function readPricingInfluence(result: DecisionConsistencyInput): Required<PricingInfluence> {
  const attribution = result.pricing_trigger_attribution ?? result.pricingTriggerAttribution ?? {};
  return {
    triggered: Boolean(attribution.triggered),
    trigger: String(attribution.trigger || 'none'),
    pricing_viewed: Boolean(attribution.pricing_viewed),
    pricing_view_count: Math.max(0, Number(attribution.pricing_view_count ?? 0) || 0),
    pricing_change: Number(attribution.pricing_change ?? 0) || 0,
  };
}

function readExportTrigger(result: DecisionConsistencyInput) {
  if (typeof result.export_triggered === 'boolean') return result.export_triggered;
  const reasonChain = Array.isArray(result.reason_chain) ? result.reason_chain.join(' ') : '';
  return readAction(result) === 'soft_paywall' || reasonChain.includes('export_pdf');
}

function severityFor(mismatches: string[]): MismatchSeverity {
  if (mismatches.some((mismatch) => mismatch.startsWith('action_mismatch') || mismatch.startsWith('export_trigger_mismatch'))) {
    return 'high';
  }
  if (mismatches.some((mismatch) => mismatch.startsWith('pricing_influence_mismatch'))) {
    return 'medium';
  }
  return mismatches.length > 0 ? 'low' : 'low';
}

export function validateDecisionConsistency(
  simulationResult: DecisionConsistencyInput,
  controlPlaneResult: DecisionConsistencyInput,
): DecisionConsistencyResult {
  const mismatches: string[] = [];
  const simulationAction = readAction(simulationResult);
  const controlPlaneAction = readAction(controlPlaneResult);
  const simulationIntent = readIntentScore(simulationResult);
  const controlPlaneIntent = readIntentScore(controlPlaneResult);
  const simulationPricing = readPricingInfluence(simulationResult);
  const controlPlanePricing = readPricingInfluence(controlPlaneResult);
  const simulationExportTriggered = readExportTrigger(simulationResult);
  const controlPlaneExportTriggered = readExportTrigger(controlPlaneResult);

  if (simulationAction !== controlPlaneAction) {
    mismatches.push(`action_mismatch: simulation=${simulationAction} control_plane=${controlPlaneAction}`);
  }

  if (Math.abs(simulationIntent - controlPlaneIntent) > 2) {
    mismatches.push(`intent_score_deviation: simulation=${simulationIntent} control_plane=${controlPlaneIntent}`);
  }

  if (
    simulationPricing.triggered !== controlPlanePricing.triggered
    || simulationPricing.trigger !== controlPlanePricing.trigger
    || simulationPricing.pricing_viewed !== controlPlanePricing.pricing_viewed
    || simulationPricing.pricing_view_count !== controlPlanePricing.pricing_view_count
  ) {
    mismatches.push(
      `pricing_influence_mismatch: simulation=${simulationPricing.trigger}:${simulationPricing.pricing_view_count} control_plane=${controlPlanePricing.trigger}:${controlPlanePricing.pricing_view_count}`,
    );
  }

  if (simulationExportTriggered !== controlPlaneExportTriggered) {
    mismatches.push(`export_trigger_mismatch: simulation=${simulationExportTriggered} control_plane=${controlPlaneExportTriggered}`);
  }

  return {
    isValid: mismatches.length === 0,
    mismatches,
    mismatchSeverity: severityFor(mismatches),
  };
}
