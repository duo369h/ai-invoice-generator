/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry to Activation Correlation Engine
 *
 * Measures which entry routes lead to fastest activation.
 *
 * RULE:
 *   ✔ analysis only
 *   ❌ no decision influence
 *   ❌ no routing logic
 */

export interface EntryCorrelationInput {
  entryRoute:       string;
  timeToActivation: number;
  activationRate:   number;
}

export interface EntryCorrelationOutput {
  entryRoute:          string;
  avgTimeToActivation: number;
  activationRate:      number;
}

export function computeEntryCorrelation(data: EntryCorrelationInput[]): EntryCorrelationOutput[] {
  return data.map(d => ({
    entryRoute:          d.entryRoute,
    avgTimeToActivation: d.timeToActivation,
    activationRate:      d.activationRate,
  }));
}
