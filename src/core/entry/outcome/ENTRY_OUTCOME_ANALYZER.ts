/**
 * Corvioz v1.5 — Entry Outcome Analyzer
 *
 * Analyzes post-frozen system behaviors, conversion rates, time elapsed, and friction points.
 *
 * RULE:
 *   ✔ READ ONLY
 *   ✔ NO routing influence
 *   ✔ NO decision making
 */

function calculateActivationRate(events: any[]): number {
  if (!events || events.length === 0) return 0;
  const activated = events.filter(e => e.activated || e.event === "activated").length;
  return Number((activated / events.length).toFixed(3));
}

function calculateTime(events: any[]): number {
  if (!events || events.length === 0) return 0;
  const times = events
    .filter(e => typeof e.timeToActivation === "number")
    .map(e => e.timeToActivation);
  if (times.length === 0) return 0;
  return Number((times.reduce((sum, val) => sum + val, 0) / times.length).toFixed(0));
}

function findBestPath(events: any[]): string {
  if (!events || events.length === 0) return "/dashboard/activation";
  const pathCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.entryRoute) {
      pathCounts[e.entryRoute] = (pathCounts[e.entryRoute] || 0) + (e.activated ? 1 : 0);
    }
  }
  const paths = Object.keys(pathCounts);
  if (paths.length === 0) return "/dashboard/activation";
  return paths.reduce((best, current) => pathCounts[current] > pathCounts[best] ? current : best, paths[0]);
}

function findFrictionPoints(events: any[]): string[] {
  const frictionPoints: string[] = [];
  const dropOffs = events.filter(e => e.dropOff);
  if (dropOffs.some(e => e.step === "dashboard_load")) {
    frictionPoints.push("dashboard_load");
  }
  if (dropOffs.some(e => e.step === "invoice_creation")) {
    frictionPoints.push("invoice_creation");
  }
  return frictionPoints.length > 0 ? frictionPoints : ["dashboard_load"];
}

export function analyzeEntryOutcome(events: any[]) {
  return {
    activation_rate: calculateActivationRate(events),
    avg_time_to_activation: calculateTime(events),
    best_entry_path: findBestPath(events),
    drop_off_points: findFrictionPoints(events)
  };
}
