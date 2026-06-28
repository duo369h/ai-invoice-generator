/**
 * Corvioz — UI Local Mutation Authority (v6.9.0 Bounded System)
 *
 * Restricts modifications to section-level mutations only.
 * ❌ Prohibited from global layout rewrites.
 */

export interface LocalMutationAdjustment {
  priority?: number;
  emphasis?: number;
  visibility?: boolean;
}

export interface LocalMutationDecision {
  sectionId: string;
  allowedAdjustments: LocalMutationAdjustment;
}

/**
 * Validates and constraints proposed mutations at section-level scope.
 */
export function authorizeLocalMutation(
  sectionId: string,
  proposed: LocalMutationAdjustment
): LocalMutationDecision {
  const allowedAdjustments: LocalMutationAdjustment = {};

  if (proposed.priority !== undefined) {
    // Keep priority adjustments bounded within [-50, 50] range
    allowedAdjustments.priority = Math.max(-50, Math.min(50, proposed.priority));
  }

  if (proposed.emphasis !== undefined) {
    // Keep emphasis weights bounded within [0, 5] range
    allowedAdjustments.emphasis = Math.max(0, Math.min(5, proposed.emphasis));
  }

  if (proposed.visibility !== undefined) {
    // Enforce that critical sections like header or safe_mode cannot be hidden locally
    if (sectionId === "section-header" || sectionId === "section-safe_mode") {
      allowedAdjustments.visibility = true;
    } else {
      allowedAdjustments.visibility = proposed.visibility;
    }
  }

  return {
    sectionId,
    allowedAdjustments,
  };
}
