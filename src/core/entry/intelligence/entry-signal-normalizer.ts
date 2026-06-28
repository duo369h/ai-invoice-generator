/**
 * Corvioz v1.3 — Entry Signal Normalizer
 *
 * Normalizes raw telemetry variables to prevent data drift.
 *
 * RULE:
 *   ✔ no business logic
 *   ✔ no routing logic
 *   ✔ only normalization layer
 */

export interface NormalizedEntrySignal {
  friction:   number;
  conversion: number;
  dropoff:    number;
  normalized: boolean;
}

export function normalizeEntrySignals(raw: any): NormalizedEntrySignal {
  return {
    friction:   Number(raw.friction ?? 0),
    conversion: Number(raw.conversion ?? 0),
    dropoff:    Number(raw.dropoff ?? 0),
    normalized: true,
  };
}
