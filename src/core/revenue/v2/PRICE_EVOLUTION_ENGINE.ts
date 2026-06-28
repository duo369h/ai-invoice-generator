/**
 * Corvioz — Price Evolution Engine v2.1
 *
 * Automatically evolve base prices based on conversion acceptance thresholds
 * and client segment valuations.
 */

export type EvolutionInput = {
  basePrice: number;
  acceptanceRate: number;
  clientSegment: string;
  elasticity: number;
};

export type EvolutionOutput = {
  newBasePrice: number;
  delta: number;
  reason: string;
};

/**
 * Calculates evolved base prices using conversion loops and client segment thresholds.
 */
export function evolvePrice(input: EvolutionInput): EvolutionOutput {
  const base = input.basePrice;
  let newBasePrice = base;
  let delta = 0;
  let reason = "Base price maintained stable based on current elasticity bounds.";

  // 1️⃣ Rule 1: High Acceptance Rate -> Raise Base Price
  if (input.acceptanceRate > 0.75) {
    const raisePercentage = input.elasticity < 0.4 ? 0.15 : 0.08; // 15% if inelastic, 8% otherwise
    newBasePrice = Math.round(base * (1.0 + raisePercentage));
    delta = newBasePrice - base;
    reason = `High acceptance rate (${Math.round(input.acceptanceRate * 100)}%) detected. Automatically evolved price upward by +${Math.round(raisePercentage * 100)}%.`;
  }
  // 2️⃣ Rule 2: Low Acceptance Rate -> Keep stable or minor downward adjustment
  else if (input.acceptanceRate < 0.3) {
    reason = `Low acceptance rate (${Math.round(input.acceptanceRate * 100)}%) detected. Prices maintained stable to support conversions.`;
  }

  // 3️⃣ Rule 3: High-value Segment premium
  if (input.clientSegment === "high" || input.clientSegment === "enterprise") {
    const shift = Math.round(newBasePrice * 0.10);
    newBasePrice += shift;
    delta += shift;
    reason += ` High-value client segment shift applied (+10% base premium).`;
  }

  return {
    newBasePrice,
    delta,
    reason,
  };
}
