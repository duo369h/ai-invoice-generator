/**
 * Corvioz v1.5 — Entry Success Signal Scorer
 *
 * Scores the quality of onboarding paths based on duration and drop-offs.
 *
 * RULE:
 *   ✔ scoring only
 *   ✔ no routing impact
 */

function computeScore(metrics: any): number {
  if (!metrics) return 0;
  const timePenalty = typeof metrics.timeToActivation === "number"
    ? Math.min(50, (metrics.timeToActivation / 120000) * 50)
    : 0;
  const dropPenalty = typeof metrics.dropOffRate === "number"
    ? metrics.dropOffRate * 50
    : 0;
  return Number(Math.max(0, 100 - (timePenalty + dropPenalty)).toFixed(1));
}

export function scoreEntrySuccess(metrics: any) {
  return {
    score: computeScore(metrics),
    isHealthy: metrics && typeof metrics.timeToActivation === "number" ? metrics.timeToActivation < 60000 : false,
    riskLevel: metrics && metrics.dropOffRate > 0.3 ? "high" : "low"
  };
}
