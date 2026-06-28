/**
 * Corvioz v1.5 — Entry Outcome Dashboard Data Layer
 *
 * Provides aggregated funnel and health indicators for visualization.
 *
 * RULE:
 *   ✔ analytics only
 *   ✔ no UI logic
 *   ✔ no routing logic
 */

function buildFunnel(data: any) {
  if (!data) return { sessions: 0, activations: 0 };
  return {
    sessions: data.sessions || 0,
    activations: data.activations || 0,
  };
}

export function getEntryOutcomeDashboard(data: any) {
  return {
    funnel: buildFunnel(data),
    conversion_rate: data && typeof data.conversionRate === "number" ? data.conversionRate : 0,
    friction_index: data && typeof data.frictionIndex === "number" ? data.frictionIndex : 0,
    recommendation_summary: []
  };
}
