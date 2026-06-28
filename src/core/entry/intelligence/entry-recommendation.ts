/**
 * Corvioz v1.3 — Entry Recommendation Layer
 *
 * Suggests soft paths based on computed activation probabilities.
 *
 * RULE:
 *   ✔ still NOT routing decision
 *   ✔ no redirects
 *   ✔ no middleware usage
 *   ✔ pure suggestion object only
 */

export interface EntryRecommendation {
  route:       string;
  type:        string;
  confidence:  number;
  reason:      string;
}

export function getEntryRecommendation(): EntryRecommendation {
  return {
    route:      "/dashboard/activation",
    type:       "STATIC_LOCKED",
    confidence: 0,
    reason:     "outcome_layer_disabled"
  };
}
