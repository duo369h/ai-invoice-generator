/**
 * RDCL v3.2.2 — Action Engine (READ-ONLY RDCL OUTPUT TRANSLATOR)
 *
 * RULE: This module CANNOT produce independent actions or decisions.
 * It translates RDCL output tokens into UI-readable action labels.
 * All decisions originate from RDCL — this module only labels them.
 */

/**
 * Maps a raw RDCL output token to a UI action label.
 * This is a pure lookup — no business logic, no branching decisions.
 */
export function translateRDCLOutput(rdclAction: string): string {
  const ACTION_LABELS: Record<string, string> = {
    UNLOCK_PREMIUM: 'UNLOCK_PREMIUM_FEATURES',
    SHOW_UPGRADE:   'SHOW_UPGRADE_MODAL',
    LIMIT_USAGE:    'INCREASE_USAGE_LIMIT',
    NO_ACTION:      'NO_ACTION',
  };
  return ACTION_LABELS[rdclAction] ?? 'NO_ACTION';
}

