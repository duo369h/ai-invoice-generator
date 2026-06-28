/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Friction Detector
 *
 * Observational analytics detecting routes with high drop-off or slow activation rates.
 *
 * RULE:
 *   👉 strictly observational analytics
 */

export interface EntryFrictionResult {
  route:         string;
  frictionScore: number;
  dropOffRate:   number;
}

export function detectEntryFriction(data: {
  route:        string;
  bounces:      number;
  sessions:     number;
  avgTimeSpent: number;
}): EntryFrictionResult {
  const dropOffRate = data.sessions > 0 ? data.bounces / data.sessions : 0;
  
  // Normalized friction score based on dropOffRate and low time spent (under 5 seconds is high friction)
  const timeWeight = data.avgTimeSpent < 5000 ? 0.4 : 0.1;
  const frictionScore = Math.min(1.0, dropOffRate * 0.7 + timeWeight);

  return {
    route:         data.route,
    frictionScore: Number(frictionScore.toFixed(3)),
    dropOffRate:   Number(dropOffRate.toFixed(3)),
  };
}
