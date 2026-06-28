/**
 * Corvioz — AI Role Registry v3.1
 *
 * Defines AI roles, permitted operations, and explicitly forbidden operations
 * to prevent AI leakage into core pricing and logic engines.
 */

export type AIRole =
  | "INPUT_PARSER"
  | "EXPLANATION_GENERATOR"
  | "FALLBACK_CLASSIFIER"
  | "UI_TEXT_WRITER"
  | "DECISION_MAKER"
  | "PRICING_ENGINE"
  | "REVENUE_CONTROLLER";

export const FORBIDDEN_ROLES = [
  "UI_TEXT_WRITER",
  "DECISION_MAKER",
  "PRICING_ENGINE",
  "REVENUE_CONTROLLER",
] as const;

export const AI_ROLE_PERMISSIONS = {
  INPUT_PARSER: ["structure_input", "ai_use"],
  EXPLANATION_GENERATOR: ["explain_decision", "ai_use"],
  FALLBACK_CLASSIFIER: ["classify_unknown", "ai_use"],
  // Explicitly forbidden operations for AI models
  forbidden: [
    "pricing_decision",
    "strategy_selection",
    "revenue_optimization",
    "win_rate_prediction",
    "game_theory",
  ],
} as const;
