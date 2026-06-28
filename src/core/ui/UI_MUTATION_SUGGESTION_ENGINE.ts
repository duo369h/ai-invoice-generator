/**
 * Corvioz — UI Mutation Suggestion Engine
 *
 * Suggestion-only layer. It never applies mutations to the UI graph.
 */

import type { UIPriorityHint } from "./UI_PRIORITY_HINT_ENGINE.ts";
import type { UISignalWeights } from "./UI_SIGNAL_WEIGHT_ENGINE.ts";

export type UIMutationSuggestion = {
  type: "BOOST" | "HIDE" | "REORDER";
  targetSection: string;
  confidence: number;
};

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function suggestMutation(weights: UISignalWeights, hint?: UIPriorityHint): UIMutationSuggestion {
  if (weights.revenueUrgency >= 0.8) {
    return {
      type: "BOOST",
      targetSection: hint?.sectionId || "section-focus",
      confidence: clampConfidence(weights.revenueUrgency),
    };
  }

  if (weights.conversionPressure >= 0.7) {
    return {
      type: "REORDER",
      targetSection: hint?.sectionId || "section-quotes",
      confidence: clampConfidence(weights.conversionPressure),
    };
  }

  if (weights.churnRisk >= 0.8) {
    return {
      type: "BOOST",
      targetSection: "section-invoices",
      confidence: clampConfidence(weights.churnRisk),
    };
  }

  return {
    type: "HIDE",
    targetSection: "section-activity",
    confidence: clampConfidence(1 - Math.max(weights.revenueUrgency, weights.conversionPressure, weights.churnRisk)),
  };
}

export function suggestUIMutations(weights: UISignalWeights, hints: UIPriorityHint[] = []): UIMutationSuggestion[] {
  const suggestions: UIMutationSuggestion[] = [];
  const activeHints = hints.filter(hint => hint.priorityBoost > 0);

  for (const hint of activeHints) {
    suggestions.push(suggestMutation(weights, hint));
  }

  if (suggestions.length === 0) {
    suggestions.push(suggestMutation(weights));
  }

  return suggestions;
}
