/**
 * OBSERVABILITY ONLY
 * DO NOT USE FOR DECISION MAKING
 *
 * v3 Strategy, Pricing Learning, Segment Matrix, and Autopilot modules are
 * retained only for analytics, visualization, debugging, and historical review.
 * Runtime quote, invoice, payment, and outcome decisions must use
 * AI_DECISION_CORE.getDecision() and AI_DECISION_GUARD.
 */

export const DEPRECATED_V3_ENGINE_POLICY = {
  mode: "observability_only",
  runtimeDecisionSource: "AI_DECISION_CORE",
  forbiddenRuntimeUses: [
    "pricing modification",
    "strategy selection",
    "recommendation override",
    "quote generation override",
    "invoice generation override",
    "payment reminder override",
  ],
} as const;
