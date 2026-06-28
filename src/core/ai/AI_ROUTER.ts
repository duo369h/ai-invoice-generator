/**
 * Corvioz — AI Router v3.1
 *
 * Gateway routing parser calls and benchmark explanations.
 */

import { AIRole } from "./AI_ROLE_REGISTRY.ts";
import { validateAIOperation } from "./AI_EXECUTION_GUARD.ts";

/**
 * Routes structured parsing input task.
 */
function parseInput(input: any): any {
  return {
    structured: true,
    data: input,
    source: "AI_INPUT_PARSER",
  };
}

/**
 * Routes dynamic pricing explanation task.
 */
function generateExplanation(input: { price: number; marketRange: [number, number] }): string {
  const [min, max] = input.marketRange;
  return `Based on similar freelance projects in this category, $${input.price} is within market range ($${min} - $${max}) and balanced between profit and acceptance rate.`;
}

/**
 * Routes category fallback classification task.
 */
function classify(input: any): string {
  return "web_design";
}

/**
 * Securely routes AI operation requests.
 */
export function aiRouter(role: AIRole, input: any): any {
  const check = validateAIOperation("ai_use", role);
  if (!check.allowed) {
    return {
      error: "AI role violation",
      reason: check.reason,
    };
  }

  switch (role) {
    case "INPUT_PARSER":
      return parseInput(input);
    case "EXPLANATION_GENERATOR":
      return generateExplanation(input);
    case "FALLBACK_CLASSIFIER":
      return classify(input);
    default:
      return { error: "Unknown AI role" };
  }
}
