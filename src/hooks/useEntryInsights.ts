/**
 * Corvioz v1.3 — useEntryInsights Hook
 *
 * Exposes entry path recommendations and telemetry metrics to the UI.
 *
 * RULE:
 *   ✔ UI can read
 *   ✔ UI cannot act
 *   ✔ no redirect logic
 */

import { buildEntryInsights } from '../core/entry/intelligence/entry-insight-engine';

export function fetchEntryInsights(user: any) {
  // Compute user landing telemetry metrics for analysis
  let friction_score = 0.1;
  if (user && !user.hasActivated) {
    friction_score = 0.75;
  }

  let activation_probability = 0.25;
  if (user && user.hasActivated) {
    activation_probability = 0.95;
  }

  const telemetry = {
    friction_score,
    activation_probability,
    most_common_success_path: "/dashboard/activation",
  };
  return buildEntryInsights(telemetry);
}

export function useEntryInsights(user: any) {
  const insights = fetchEntryInsights(user);
  return {
    insights,
    recommendedRoute: insights.best_entry_route,
    shouldGuide:       insights.activation_probability < 0.5,
  };
}
