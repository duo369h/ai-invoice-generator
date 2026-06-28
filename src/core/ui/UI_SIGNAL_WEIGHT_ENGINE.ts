/**
 * Corvioz — UI Signal Weight Engine
 *
 * Pure signal weighting. No UI, routing, storage, or mutation side effects.
 */

export type UISignalWeights = {
  conversionPressure: number;
  revenueUrgency: number;
  churnRisk: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function churnRiskWeight(churnRisk: any): number {
  if (churnRisk === "HIGH") return 1;
  if (churnRisk === "MEDIUM") return 0.55;
  if (churnRisk === "LOW") return 0.15;
  return clamp01(Number(churnRisk || 0));
}

export function calculateSignalWeights(signal: any = {}): UISignalWeights {
  return {
    conversionPressure: clamp01(signal.conversionDrop ? 1 : Number(signal.conversionPressure || 0)),
    revenueUrgency: clamp01(Number(signal.revenueProbability ?? signal.revenueUrgency ?? 0)),
    churnRisk: churnRiskWeight(signal.churnRisk),
  };
}

export { calculateSignalWeights as getSignalWeights };
