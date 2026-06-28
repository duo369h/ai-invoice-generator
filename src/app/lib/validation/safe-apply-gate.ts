import { validateRevenueAction, type ValidationEngineInput, type ValidationEngineResult } from './validation-engine';

export type SafeApplyGateInput = ValidationEngineInput;

export type SafeApplyGateResult = ValidationEngineResult & {
  final_action: string;
  rollback_suggestion?: string;
};

export function evaluateSafeApplyGate(input: SafeApplyGateInput = {}): SafeApplyGateResult {
  const validation = validateRevenueAction(input);
  const requestedAction = String(input.recommended_action || 'allow');

  if (validation.risk_level === 'critical') {
    return {
      ...validation,
      approved: false,
      final_action: 'block_apply',
      rollback_suggestion: 'Rollback the latest automated monetization change and restore the previous safe-mode rule set.',
    };
  }

  if (validation.risk_level === 'high') {
    return {
      ...validation,
      approved: false,
      final_action: 'block_apply',
    };
  }

  if (validation.risk_level === 'medium') {
    return {
      ...validation,
      approved: true,
      final_action: validation.adjusted_action || 'upsell',
    };
  }

  return {
    ...validation,
    approved: true,
    final_action: requestedAction,
  };
}
