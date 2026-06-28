/**
 * Corvioz — Learning State Store v3.1
 *
 * Persists decision records and pricing profiles.
 */

import type { DecisionEvent } from "./REVENUE_DECISION_LOGGER.ts";
import type { PricingProfile } from "./PRICING_LEARNING_PROFILE_ENGINE.ts";

export type LearningState = {
  userId: string;
  profile: PricingProfile;
  history: DecisionEvent[];
  lastUpdated: number;
};

const storeCache = new Map<string, LearningState>();

/**
 * Saves state in local memory cache.
 */
export function saveLearningState(userId: string, state: LearningState): void {
  storeCache.set(userId, {
    ...state,
    lastUpdated: Date.now(),
  });
}

/**
 * Loads state from memory cache.
 */
export function getLearningState(userId: string): LearningState | null {
  return storeCache.get(userId) || null;
}

/**
 * Clears the store cache.
 */
export function clearStore(): void {
  storeCache.clear();
}
