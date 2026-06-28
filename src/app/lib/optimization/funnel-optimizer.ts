export type FunnelOptimizationStep = {
  step: string;
  visitors?: number;
  conversions?: number;
  conversion_rate?: number;
  drop_off_rate?: number;
  intent_score?: number;
  exit_rate?: number;
};

export type FunnelOptimizationInput = {
  steps?: FunnelOptimizationStep[];
  drop_off_by_step?: Record<string, number>;
  conversion_by_step?: Record<string, number>;
  intent_by_step?: Record<string, number>;
};

export type FunnelOptimizationResult = {
  steps_to_modify: string[];
  suggested_changes: string[];
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeRate(value: unknown) {
  const next = toNumber(value, 0);
  return next > 1 ? next / 100 : next;
}

function buildSteps(input: FunnelOptimizationInput = {}) {
  const explicitSteps = input.steps || [];
  const stepNames = new Set<string>([
    ...explicitSteps.map((step) => step.step),
    ...Object.keys(input.drop_off_by_step || {}),
    ...Object.keys(input.conversion_by_step || {}),
    ...Object.keys(input.intent_by_step || {}),
  ]);

  return Array.from(stepNames).map((stepName) => {
    const explicit = explicitSteps.find((step) => step.step === stepName) || { step: stepName };
    const visitors = Math.max(0, toNumber(explicit.visitors, 0));
    const conversions = Math.max(0, toNumber(explicit.conversions, 0));
    const inferredConversionRate = visitors > 0 ? conversions / visitors : 0;
    const dropOffRate = normalizeRate(explicit.drop_off_rate ?? explicit.exit_rate ?? input.drop_off_by_step?.[stepName]);
    const conversionRate = normalizeRate(explicit.conversion_rate ?? input.conversion_by_step?.[stepName] ?? inferredConversionRate);
    const intentScore = Math.max(0, Math.min(100, toNumber(explicit.intent_score ?? input.intent_by_step?.[stepName], 0)));

    return {
      step: stepName,
      dropOffRate,
      conversionRate,
      intentScore,
    };
  });
}

export function optimizeFunnel(input: FunnelOptimizationInput = {}): FunnelOptimizationResult {
  const steps = buildSteps(input);
  const stepsToModify: string[] = [];
  const suggestedChanges: string[] = [];

  steps.forEach((step) => {
    if (step.dropOffRate >= 0.35) {
      stepsToModify.push(step.step);
      suggestedChanges.push(`Reduce friction at ${step.step}: shorten the path, preserve intent, and show the next value action immediately.`);
    }

    if (step.conversionRate > 0 && step.conversionRate < 0.18) {
      stepsToModify.push(step.step);
      suggestedChanges.push(`Improve conversion at ${step.step}: add a lower-friction continuation and defer nonessential choices.`);
    }

    if (step.intentScore >= 70 && step.dropOffRate >= 0.2) {
      stepsToModify.push(step.step);
      suggestedChanges.push(`Recover high-intent leakage at ${step.step}: trigger pricing, checkout, or saved-intent routing before exit.`);
    }
  });

  return {
    steps_to_modify: Array.from(new Set(stepsToModify)),
    suggested_changes: Array.from(new Set(suggestedChanges)),
  };
}
