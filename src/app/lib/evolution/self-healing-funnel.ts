export type FunnelHealthInput = {
  drop_off_by_step?: Record<string, number>;
  broken_paths?: string[];
  apply_fix?: boolean;
};

export type FunnelHealingResult = {
  detected_issues: string[];
  suggested_fixes: string[];
  applied_fixes: string[];
  rollback_plan: string[];
};

function normalizeRate(value: unknown) {
  const next = Number(value || 0);
  if (!Number.isFinite(next)) return 0;
  return next > 1 ? next / 100 : next;
}

function fixForStep(step: string) {
  if (step.includes('signup')) return `Restore saved intent and route directly to first-value action after ${step}.`;
  if (step.includes('pricing')) return `Reduce pricing friction at ${step} with Pro-first recommendation and preserved checkout intent.`;
  if (step.includes('export')) return `Replace abrupt export block at ${step} with value-framed Pro upgrade and fallback path.`;
  if (step.includes('invoice')) return `Open invoice builder with previous session context before applying paywall at ${step}.`;
  if (step.includes('quote')) return `Preserve quote draft and trigger upgrade only after quote value is visible at ${step}.`;
  return `Add recovery action and analytics checkpoint for ${step}.`;
}

export function healFunnel(input: FunnelHealthInput = {}): FunnelHealingResult {
  const highDropOffSteps = Object.entries(input.drop_off_by_step || {})
    .filter(([, rate]) => normalizeRate(rate) >= 0.35)
    .map(([step]) => step);
  const brokenPaths = input.broken_paths || [];
  const detectedIssues = [
    ...highDropOffSteps.map((step) => `high_drop_off:${step}`),
    ...brokenPaths.map((path) => `broken_path:${path}`),
  ];
  const suggestedFixes = [
    ...highDropOffSteps.map(fixForStep),
    ...brokenPaths.map((path) => `Repair conversion path ${path} with safe redirect fallback and event checkpoint.`),
  ];

  return {
    detected_issues: detectedIssues,
    suggested_fixes: Array.from(new Set(suggestedFixes)),
    applied_fixes: input.apply_fix ? Array.from(new Set(suggestedFixes)).map((fix) => `safe_mode:${fix}`) : [],
    rollback_plan: input.apply_fix ? Array.from(new Set(suggestedFixes)).map((fix) => `rollback:${fix}`) : [],
  };
}
