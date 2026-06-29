/**
 * Corvioz v1.5 — Entry State Authority
 *
 * Single source of truth for route-level auth, guest, and activation state.
 * This layer only decides entry state. It does not verify API access or billing.
 */

export const ENTRY_STATES = {
  GUEST: 'GUEST',
  AUTHENTICATED: 'AUTHENTICATED',
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
} as const;

export function isAuthenticatedUser(input: any = {}): boolean {
  if (input?.session?.access_token) return true;
  if (input?.access_token) return true;
  if (input?.token) return true;
  if (input?.user?.id || input?.user?.email) return true;

  return false;
}

export function isGuestUser(input: any = {}): boolean {
  return !isAuthenticatedUser(input);
}

export function isActivationRequired(input: any = {}): boolean {
  return getEntryState(input) === ENTRY_STATES.ACTIVATION_REQUIRED;
}

export function getEntryState(input: any = {}) {
  if (!isAuthenticatedUser(input)) {
    return ENTRY_STATES.GUEST;
  }

  if (
    input?.activationRequired === true ||
    input?.onboardingComplete === false ||
    input?.user?.hasActivated === false
  ) {
    return ENTRY_STATES.ACTIVATION_REQUIRED;
  }

  return ENTRY_STATES.AUTHENTICATED;
}
