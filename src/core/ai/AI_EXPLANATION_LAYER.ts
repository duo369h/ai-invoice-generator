/**
 * Corvioz — AI Explanation Layer v3.1
 *
 * Formats pricing outputs and user adjustments into human-readable benchmarks.
 */

import { aiRouter } from "./AI_ROUTER.ts";

export type ExplanationInput = {
  price: number;
  marketRange: {
    min: number;
    max: number;
  };
};

/**
 * Returns clean formatting description.
 */
export function getPricingExplanation(input: ExplanationInput): string {
  const rangeTuple: [number, number] = [input.marketRange.min, input.marketRange.max];

  return aiRouter("EXPLANATION_GENERATOR", {
    price: input.price,
    marketRange: rangeTuple,
  });
}
