export function assertCoreDecisionSource(source: string) {
  if (source !== "AI_DECISION_CORE") {
    throw new Error("FORBIDDEN_DECISION_SOURCE");
  }
}
