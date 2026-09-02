export const DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS = 30_000;
export const MIN_SEMANTIC_REVIEW_TIMEOUT_MS = 5_000;
export const MAX_SEMANTIC_REVIEW_TIMEOUT_MS = 60_000;

export function parseSemanticReviewTimeoutMs(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)
    || parsed < MIN_SEMANTIC_REVIEW_TIMEOUT_MS
    || parsed > MAX_SEMANTIC_REVIEW_TIMEOUT_MS) {
    return DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS;
  }
  return parsed;
}
