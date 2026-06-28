import { RDCL } from "../revenue/RDCL";

export function decisionEngine(event: any, context: any) {
  return RDCL(event, context);
}

// Backwards compatibility wrapper for runtime-orchestrator
export interface DecisionResult {
  primaryAction: string;
  secondaryActions: string[];
  suppressedActions: string[];
  uiOverrideLevel: 'none' | 'soft' | 'hard';
}

export function resolveDecision(signal: string, context: any): DecisionResult {
  const action = RDCL(signal as any, context);
  
  let primaryAction = 'NO_ACTION';
  let uiOverrideLevel: 'none' | 'soft' | 'hard' = 'none';

  if (action === 'UNLOCK_PREMIUM') {
    primaryAction = 'UNLOCK_PREMIUM_FEATURES';
  } else if (action === 'SHOW_UPGRADE') {
    primaryAction = 'SHOW_UPGRADE_MODAL';
    uiOverrideLevel = 'hard';
  } else if (action === 'LIMIT_USAGE') {
    primaryAction = 'INCREASE_USAGE_LIMIT';
    uiOverrideLevel = 'soft';
  }

  return {
    primaryAction,
    secondaryActions: [],
    suppressedActions: [],
    uiOverrideLevel,
  };
}
