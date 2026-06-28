/**
 * RDCL v3.2.2 — Conflict Resolver (LIGHTWEIGHT HELPER ONLY)
 *
 * RULE: This module CANNOT generate logic, heuristics, or multi-step scoring.
 * It performs a single-pass priority sort and returns the top action.
 * RDCL is the sole decision authority — this is only a sort utility.
 */

export interface PrioritizedAction {
  action: string;
  /** Lower number = higher priority (1 = highest) */
  priority: number;
}

/**
 * Given a list of candidate actions with priority ranks,
 * returns the single highest-priority action (lowest priority number).
 * Ties are broken by first occurrence.
 */
export function resolveConflict(actions: PrioritizedAction[]): string {
  if (actions.length === 0) return 'NO_ACTION';
  return actions.sort((a, b) => a.priority - b.priority)[0].action;
}

