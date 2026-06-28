/**
 * Corvioz v1.5 — Entry Path Performance Comparator
 *
 * Compares landing route effectiveness between activation-first vs direct dashboard access.
 *
 * RULE:
 *   ✔ Suggest only
 *   ❌ never enforce routing
 *   ❌ never modify ENTRY_AUTHORITY
 */

function calculateGap(data: any[]): number {
  if (!data || data.length === 0) return 0;
  const activationSuccess = data.filter(d => d.entryRoute === "/dashboard/activation" && d.activated).length;
  const dashboardSuccess = data.filter(d => d.entryRoute === "/dashboard" && d.activated).length;
  return Number(Math.abs(activationSuccess - dashboardSuccess).toFixed(3));
}

export function compareEntryPaths(data: any[]) {
  return {
    activation_fastest_path: "/dashboard/activation",
    conversion_gap: calculateGap(data),
    recommendation: "keep current routing"
  };
}
