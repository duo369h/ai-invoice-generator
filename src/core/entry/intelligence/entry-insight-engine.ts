/**
 * Corvioz v1.3 — Entry Insight Engine
 *
 * Compiles telemetry signals into non-executing insights.
 *
 * RULE:
 *   ✔ must NOT redirect
 *   ✔ must NOT enforce route
 *   ✔ must NOT call ENTRY_AUTHORITY
 *   👉 output only data
 */

export interface EntryInsightPayload {
  best_entry_route:       string;
  friction_score:         number;
  activation_probability: number;
  recommended_flow:       string;
  confidence:             number;
}

export function buildEntryInsights(telemetry: {
  friction_score:           number;
  activation_probability:   number;
  most_common_success_path: string;
}): EntryInsightPayload {
  return {
    best_entry_route:       "/dashboard/activation",
    friction_score:         telemetry.friction_score,
    activation_probability: telemetry.activation_probability,
    recommended_flow:       telemetry.most_common_success_path,
    // IMPORTANT: NO EXECUTION
    confidence:             0.0,
  };
}
