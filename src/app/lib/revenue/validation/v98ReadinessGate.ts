export type V98ReadinessInput = {
  mismatch_rate?: number;
  false_block_rate?: number;
  explainability_complete?: boolean;
};

export type V98ReadinessResult = {
  v98_ready: boolean;
  mismatch_rate: number;
  false_block_rate: number;
  explainability_complete: boolean;
};

function clampRate(value: unknown) {
  const next = Number(value ?? 0);
  if (!Number.isFinite(next)) return 0;
  return Math.max(0, Math.min(1, next));
}

export function evaluateV98Readiness(input: V98ReadinessInput = {}): V98ReadinessResult {
  const mismatchRate = clampRate(input.mismatch_rate);
  const falseBlockRate = clampRate(input.false_block_rate);
  const explainabilityComplete = input.explainability_complete === true;

  return {
    v98_ready: mismatchRate < 0.05 && falseBlockRate < 0.08 && explainabilityComplete,
    mismatch_rate: mismatchRate,
    false_block_rate: falseBlockRate,
    explainability_complete: explainabilityComplete,
  };
}
