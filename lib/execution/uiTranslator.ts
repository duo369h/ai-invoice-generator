/**
 * UI Decision Translator Layer (Translator) — Corvioz v8.5
 *
 * Pure mapper that translates unified decisions into UI action fields.
 * STRICTLY NO scoring, thresholds, or inferences.
 */

/**
 * Translates the unified decision into simple visual state properties.
 *
 * @param decision - The raw decision output from unifiedDecisionEngine.
 */
export function translateDecision(decision: any) {
  return {
    banner: decision.upgradeSignal.showBanner ? decision.recommendedPlan : 'none',
    modal: decision.upgradeSignal.showModal ? 'upgrade' : null,
    highlightPlan: decision.recommendedPlan,
    disabled: decision.riskSignal.isChurnBlocked,
  };
}
