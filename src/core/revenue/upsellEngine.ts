import { detectArpuSignals, type ArpuSignalInput } from './arpuSignals';
import { resolveRevenueLifecycleStage, type RevenueLifecycleInput } from './lifecycleMap';

export type UpsellTriggerType =
  | 'none'
  | 'usage_threshold_reached'
  | 'export_frequency_high'
  | 'workflow_repetition'
  | 'client_scaling';

export interface UpsellEngineInput extends ArpuSignalInput, RevenueLifecycleInput {
  lastUpsellShownDaysAgo?: number;
}

export interface UpsellRecommendation {
  shouldSuggestUpgrade: boolean;
  trigger: UpsellTriggerType;
  recommendedPlan: 'starter' | 'pro' | 'studio' | null;
  confidence: number;
  message: string;
  guardrail: string;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateUpsellOpportunity(input: UpsellEngineInput = {}): UpsellRecommendation {
  const signals = detectArpuSignals(input);
  const lifecycle = resolveRevenueLifecycleStage(input);
  const exportCount = input.exportCount ?? 0;
  const clientCount = input.clientCount ?? 0;
  const workflowCount = (input.invoiceCount ?? 0) + (input.quoteCount ?? 0);
  const cooldownActive = (input.lastUpsellShownDaysAgo ?? 99) < 3;

  if (cooldownActive) {
    return {
      shouldSuggestUpgrade: false,
      trigger: 'none',
      recommendedPlan: null,
      confidence: 0,
      message: 'Suppress upgrade suggestion during prompt cooldown.',
      guardrail: 'Suggestion only; existing paywall and pricing rules remain authoritative.',
    };
  }

  let trigger: UpsellTriggerType = 'none';
  if (clientCount >= 8) trigger = 'client_scaling';
  else if (exportCount >= 4) trigger = 'export_frequency_high';
  else if (workflowCount >= 6) trigger = 'workflow_repetition';
  else if (signals.upgradeLikelihoodScore >= 55) trigger = 'usage_threshold_reached';

  const confidence = clampScore((signals.upgradeLikelihoodScore + lifecycle.score) / 2);
  const shouldSuggestUpgrade = trigger !== 'none' && confidence >= 45;

  return {
    shouldSuggestUpgrade,
    trigger,
    recommendedPlan: signals.recommendedPlan,
    confidence,
    message: shouldSuggestUpgrade
      ? `User is in ${lifecycle.stage} with ${signals.revenueIntent} revenue intent; suggest ${signals.recommendedPlan ?? 'paid'} plan contextually.`
      : 'No revenue expansion suggestion should be shown yet.',
    guardrail: 'This engine only recommends suggestion timing and copy context; it does not change pricing, entitlement, checkout, or canonical decisions.',
  };
}
