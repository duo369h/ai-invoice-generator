/**
 * Corvioz v1 — First Success Guard
 *
 * Ensures every user reaches at least ONE success event.
 * Guides — never blocks. Never gates. Never prevents action.
 *
 * If a user has no success event, returns a guided action.
 * If a user has any success event, returns "SUCCESS".
 *
 * RULE:
 *   ✓ Must NOT block user
 *   ✓ Only guide
 *   ✓ No gating
 */

export type FirstSuccessResult =
  | 'SUCCESS'
  | 'FORCE_GUIDED_FIRST_ACTION';

export interface FirstSuccessGuidance {
  result:      FirstSuccessResult;
  /** Populated when result is FORCE_GUIDED_FIRST_ACTION */
  guidance?:   {
    message:    string;
    cta:        string;
    cta_route:  string;
  };
}

/** User success state — provided by caller from DB/session */
export interface UserSuccessState {
  hasCreatedInvoice: boolean;
  hasCreatedQuote:   boolean;
  hasCreatedClient:  boolean;
}

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Checks if a user has reached any first success.
 * Returns guidance toward the fastest success path if not.
 */
export function ensureFirstSuccess(user: UserSuccessState): FirstSuccessGuidance {
  const hasAnySuccess =
    user.hasCreatedInvoice ||
    user.hasCreatedQuote   ||
    user.hasCreatedClient;

  if (hasAnySuccess) {
    return { result: 'SUCCESS' };
  }

  // Guide toward the fastest, most valuable first success: invoice creation
  return {
    result: 'FORCE_GUIDED_FIRST_ACTION',
    guidance: {
      message:   'Create your first invoice to get paid — takes under 60 seconds.',
      cta:       'Create Invoice',
      cta_route: '/quotes/create',
    },
  };
}

/**
 * Returns true if the user has reached any first success event.
 * Convenience shorthand for conditional rendering.
 */
export function hasFirstSuccess(user: UserSuccessState): boolean {
  return (
    user.hasCreatedInvoice ||
    user.hasCreatedQuote   ||
    user.hasCreatedClient
  );
}

/**
 * Returns the single highest-value first-action route for a new user.
 * Always returns invoice creation — the action with highest revenue signal value.
 */
export function getFirstSuccessRoute(): string {
  return '/quotes/create';
}
