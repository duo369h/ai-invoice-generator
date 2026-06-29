/**
 * Corvioz v1.5 — Entry State Authority
 *
 * Single source of truth for route-level auth, guest, and activation state.
 * This layer only decides entry state. It does not verify API access or billing.
 */

export const ENTRY_AUTH_COOKIE = 'corvioz_entry_auth';

export const ENTRY_STATES = {
  GUEST: 'GUEST',
  AUTHENTICATED: 'AUTHENTICATED',
  ACTIVATION_REQUIRED: 'ACTIVATION_REQUIRED',
} as const;

export const ENTRY_AUTH_COOKIE_VALUES = {
  AUTHENTICATED: 'authenticated',
  ACTIVATION_REQUIRED: 'activation_required',
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

export function getEntryCookieValueForState(state: string) {
  if (state === ENTRY_STATES.ACTIVATION_REQUIRED) {
    return ENTRY_AUTH_COOKIE_VALUES.ACTIVATION_REQUIRED;
  }
  if (state === ENTRY_STATES.AUTHENTICATED) {
    return ENTRY_AUTH_COOKIE_VALUES.AUTHENTICATED;
  }
  return '';
}

export function writeClientEntryState(state: string) {
  if (typeof document === 'undefined') return;
  document.cookie = 'corvioz_entry_auth=; path=/; max-age=0; SameSite=Lax';
}

export function writeClientEntrySessionState(session: any, input: any = {}) {
  if (typeof document === 'undefined') return;

  document.cookie = 'corvioz_entry_auth=; path=/; max-age=0; SameSite=Lax';

  if (session?.access_token) {
    document.cookie = `sb-auth-token=${session.access_token}; path=/; max-age=2592000; SameSite=Lax`;
  } else {
    document.cookie = 'sb-auth-token=; path=/; max-age=0; SameSite=Lax';
  }
}
