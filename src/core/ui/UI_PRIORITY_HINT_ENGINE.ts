/**
 * Corvioz — UI Priority Hint Engine
 *
 * Produces section-level hints only. It does not sort, render, or mutate UI.
 */

import type { UISignalWeights } from "./UI_SIGNAL_WEIGHT_ENGINE.ts";

export type UIPriorityHint = {
  sectionId: string;
  priorityBoost: number;
};

function clampBoost(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(50, Math.round(value)));
}

export function generatePriorityHint(sectionId: string, weights: UISignalWeights): UIPriorityHint {
  let priorityBoost = 0;

  if (sectionId === "section-focus" || sectionId === "section-actions") {
    priorityBoost += weights.revenueUrgency * 24;
  }
  if (sectionId === "section-quotes" || sectionId === "section-leads") {
    priorityBoost += weights.conversionPressure * 18;
  }
  if (sectionId === "section-invoices") {
    priorityBoost += weights.churnRisk * 22;
  }
  if (sectionId === "section-onboarding") {
    priorityBoost += Math.max(weights.conversionPressure, weights.churnRisk) * 10;
  }

  return {
    sectionId,
    priorityBoost: clampBoost(priorityBoost),
  };
}

export function generatePriorityHints(weights: UISignalWeights): UIPriorityHint[] {
  return [
    "section-focus",
    "section-actions",
    "section-quotes",
    "section-leads",
    "section-invoices",
    "section-onboarding",
  ].map(sectionId => generatePriorityHint(sectionId, weights));
}
