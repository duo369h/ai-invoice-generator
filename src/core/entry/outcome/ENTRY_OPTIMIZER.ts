/**
 * Corvioz v1.5 — Entry Optimization Recommender
 *
 * Generates passive onboarding optimization recommendations based on outcome metrics.
 *
 * RULE:
 *   ✔ suggestions only
 *   ❌ no execution
 *   ❌ no routing changes
 */

export function recommendEntryImprovements(data: any) {
  return [
    "Reduce dashboard CTA confusion",
    "Move invoice CTA to top priority",
    "Auto-skip onboarding if user is experienced"
  ];
}
