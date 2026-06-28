/**
 * Corvioz — UI Graph Composer (v6.9.1 Recovery Edition)
 *
 * Receives a resolved layout and applies pass-through rendering.
 *
 * ✔ Allowed: applySoftWeights(sections, weights) for soft reorder, emphasis boost, visual priority drift.
 * ❌ Forbidden: filter, hard sort replacement, deletion logic.
 */

import { validateAuthority } from "../runtime/UI_AUTHORITY_LAYER.ts";
import type { Section } from "../UI_GRAPH_CONTRACT.ts";
import { authorizeLocalExecution } from "../authority/UI_LOCAL_EXECUTION_AUTHORITY.ts";
import { drift } from "../UI_SECTION_DRIFT_ENGINE.ts";

export const MUTATION_SCOPE = "UI_ONLY";

/**
 * Pure pass-through renderer. Conforms to the authority validation boundary.
 */
export function render(sections: Section[]): Section[] {
  validateAuthority(sections, sections);
  return sections;
}

/**
 * Applies soft weights to sections for soft priority drift and emphasis boost.
 */
export function applySoftWeights(sections: Section[], weights: any): Section[] {
  const emphasisBoost = weights?.distributionDelta || 0;

  const shifted = sections.map(sec => {
    const sectionAuthority = authorizeLocalExecution(sec.type);
    let driftScore = 0;

    if (sec.type === "FOCUS" && weights?.signalWeights?.revenue) {
      driftScore = weights.signalWeights.revenue * 0.5;
    } else if (sec.type === "FLOW" && weights?.signalWeights?.conversion) {
      driftScore = weights.signalWeights.conversion * 0.3;
    }

    return drift(sec, {
      allowedActions: sectionAuthority.allowedActions,
      constraints: {
        maxDriftScore: Math.min(
          sectionAuthority.constraints.maxDriftScore,
          Math.max(driftScore, emphasisBoost)
        ),
      },
    });
  });

  // Soft reorder using sorting by priority drift
  shifted.sort((a, b) => b.uiDecision.priority - a.uiDecision.priority);
  return shifted;
}
