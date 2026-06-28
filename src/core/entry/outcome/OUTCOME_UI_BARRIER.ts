/**
 * Corvioz v1.6.1 — Outcome UI Barrier
 *
 * Restricts UI access to outcome data, returning only plain metrics.
 */

export function sanitizeOutcomeForUI(data: any) {
  return {
    metrics: {
      friction: data?.friction,
      successRate: data?.successRate,
      conversionTime: data?.conversionTime
    },
    recommendations: null
  };
}
