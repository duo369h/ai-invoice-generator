/**
 * Corvioz v1.6 — Outcome Layer Contract
 *
 * Semantic lock confirming that all outcome systems are non-actionable advisory data.
 *
 * RULE:
 *   ✔ This is a semantic lock
 *   ❌ No execution meaning allowed
 */

export const OUTCOME_CONTRACT = {
  SCORING: "non_actionable",
  FRICTION: "non_actionable",
  COMPARISON: "non_actionable",
  RECOMMENDATION: "non_actionable",
  ANALYTICS: "non_actionable"
};
