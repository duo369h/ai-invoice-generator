/**
 * Corvioz — Revenue Consistency Engine
 *
 * Degraded to debug observer / logging only.
 * Does not influence UI rendering or invoke truth locks.
 */

export type ConsistencyResult = {
  drift: string[];
  severity: "LOW" | "MEDIUM" | "HIGH";
  reportOnly: boolean;
};

export function validateRuntimeConsistency(
  snapshot: any,
  expectation: any
): ConsistencyResult {
  const drift: string[] = [];

  const actualCTA = snapshot?.semanticValidatedUI?.cta?.label;
  const actualPricing = snapshot?.semanticValidatedUI?.pricingTag?.price;
  const actualStage = snapshot?.semanticValidatedUI?.badge?.label;

  if (expectation?.expectedCTA && expectation.expectedCTA !== actualCTA) {
    drift.push(`CTA Mismatch: Expected '${expectation.expectedCTA}', got '${actualCTA}'`);
  }

  if (expectation?.expectedPricing && expectation.expectedPricing !== actualPricing) {
    drift.push(`Pricing Mismatch: Expected '${expectation.expectedPricing}', got '${actualPricing}'`);
  }

  if (expectation?.expectedStage && expectation.expectedStage !== actualStage) {
    drift.push(`Funnel Mismatch: Expected '${expectation.expectedStage}', got '${actualStage}'`);
  }

  let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (drift.length > 0) {
    const hasHighDrift = expectation.expectedCTA !== actualCTA || expectation.expectedStage !== actualStage;
    severity = hasHighDrift ? "HIGH" : "MEDIUM";
    console.warn("[Consistency Observer] Drift detected:", drift);
  }

  return {
    drift,
    severity,
    reportOnly: true,
  };
}
