/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Analytics Aggregator
 *
 * Combines all telemetry metrics into high-level analytical indicators.
 *
 * RULE:
 *   👉 NO decision making
 *   👉 NO routing influence
 */

export interface EntryAnalyticsIndicators {
  entryHealthScore:     number;
  activationEfficiency: number;
  systemFrictionIndex:  number;
}

export function aggregateEntryAnalytics(data: {
  frictionScores: number[];
  driftViolationsCount: number;
  activationRates: number[];
}): EntryAnalyticsIndicators {
  const avgFriction = data.frictionScores.length > 0
    ? data.frictionScores.reduce((sum, score) => sum + score, 0) / data.frictionScores.length
    : 0;

  const avgActivation = data.activationRates.length > 0
    ? data.activationRates.reduce((sum, rate) => sum + rate, 0) / data.activationRates.length
    : 0;

  // Health decreases with drift violations and friction
  const driftPenalty = Math.min(0.5, data.driftViolationsCount * 0.1);
  const entryHealthScore = Math.max(0, 1.0 - (avgFriction * 0.5 + driftPenalty));

  return {
    entryHealthScore:     Number(entryHealthScore.toFixed(3)),
    activationEfficiency: Number(avgActivation.toFixed(3)),
    systemFrictionIndex:  Number(avgFriction.toFixed(3)),
  };
}

export type EntryAnalytics = {
  friction_score:         number;
  activation_probability: number;
  best_path:              string;
  insight_ready:          boolean;
};
