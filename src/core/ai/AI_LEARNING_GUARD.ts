/**
 * AI Learning Guard — Enforces Single Source of Truth Write Path.
 */
export function validateLearningSource(source: string) {
  if (source !== "AI_DECISION_CORE") {
    throw new Error("FORBIDDEN_LEARNING_PATH_DETECTED");
  }
}
