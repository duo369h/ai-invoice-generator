/**
 * Corvioz — UI Feedback To Weight Mapper
 *
 * Maps raw feedback signals into weight deltas only.
 */

export type UIFeedbackWeightInput = {
  clicks?: number;
  scrollDepth?: number;
  dropoff?: boolean | number;
};

export type UIFeedbackWeightDelta = {
  revenueDelta: number;
  conversionDelta: number;
  churnDelta: number;
};

function clampDelta(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-0.5, Math.min(0.5, Number(value.toFixed(2))));
}

export function mapFeedbackToWeightDelta(input: UIFeedbackWeightInput = {}): UIFeedbackWeightDelta {
  const clicks = Math.max(0, Number(input.clicks || 0));
  const scrollDepth = Math.max(0, Math.min(1, Number(input.scrollDepth || 0)));
  const dropoff = typeof input.dropoff === "boolean"
    ? (input.dropoff ? 1 : 0)
    : Math.max(0, Math.min(1, Number(input.dropoff || 0)));

  return {
    revenueDelta: clampDelta(clicks * 0.03 + scrollDepth * 0.08 - dropoff * 0.12),
    conversionDelta: clampDelta(dropoff * 0.18 + (1 - scrollDepth) * 0.05),
    churnDelta: clampDelta(dropoff * 0.12 - clicks * 0.01),
  };
}

export { mapFeedbackToWeightDelta as feedbackToWeightDelta };
