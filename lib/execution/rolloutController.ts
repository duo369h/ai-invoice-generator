/**
 * Rollout Controller — Corvioz v5.5 Controlled Execution Layer
 *
 * Implements deterministic client/server A/B rollout percentages based on userId hashing.
 */

export interface RolloutConfig {
  execution_enabled_users: number; // e.g. 0.2 (20%)
  modal_allowed_users: number;     // e.g. 0.05 (5%)
  banner_all_users: boolean;       // e.g. true (100% rollout)
}

export const DEFAULT_ROLLOUT_CONFIG: RolloutConfig = {
  execution_enabled_users: 0.2,
  modal_allowed_users: 0.05,
  banner_all_users: true,
};

/**
 * Deterministically check if a user is within the rollout group for a specific feature.
 *
 * @param userId - The user ID to evaluate. If empty, falls back to false.
 * @param feature - The rollout feature: 'execution' (20% gate), 'modal' (5% gate), or 'banner' (always allowed).
 * @param config - Optional configuration override.
 */
export function isUserInRollout(
  userId: string | null | undefined,
  feature: 'execution' | 'modal' | 'banner',
  config: RolloutConfig = DEFAULT_ROLLOUT_CONFIG
): boolean {
  // If banner, it's rolled out to all users
  if (feature === 'banner' && config.banner_all_users) {
    return true;
  }

  if (!userId) {
    return false;
  }

  // Generate a deterministic integer hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to a 32-bit signed integer
  }

  // Normalize hash to a float between 0 and 1
  const normalized = Math.abs(hash % 1000) / 1000;

  if (feature === 'execution') {
    return normalized < config.execution_enabled_users;
  }

  if (feature === 'modal') {
    return normalized < config.modal_allowed_users;
  }

  return false;
}
