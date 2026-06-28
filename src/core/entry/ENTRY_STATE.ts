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

function readCookieValue(cookies: any, name: string): string {
  if (!cookies) return '';
  if (typeof cookies.get === 'function') {
    const value = cookies.get(name);
    if (typeof value === 'string') return value;
    return value?.value || '';
  }
  if (typeof cookies === 'object') {
    const value = cookies[name];
    if (typeof value === 'string') return value;
    return value?.value || '';
  }
  return '';
}

function hasSupabaseAuthCookie(cookies: any): boolean {
  if (!cookies) return false;

  if (typeof cookies.getAll === 'function') {
    return cookies.getAll().some((cookie: any) => {
      const name = String(cookie?.name || '');
      const value = String(cookie?.value || '');
      return name.startsWith('sb-') && name.includes('auth-token') && value.length > 0;
    });
  }

  if (typeof cookies === 'object') {
    return Object.keys(cookies).some((name) => {
      const value = readCookieValue(cookies, name);
      return name.startsWith('sb-') && name.includes('auth-token') && value.length > 0;
    });
  }

  return false;
}

export function isAuthenticatedUser(input: any = {}): boolean {
  if (input?.session?.access_token) return true;
  if (input?.access_token) return true;
  if (input?.token) return true;
  if (input?.user?.id || input?.user?.email) return true;

  const cookies = input?.cookies || input?.request?.cookies;
  const entryCookie = readCookieValue(cookies, ENTRY_AUTH_COOKIE);
  if (
    entryCookie === ENTRY_AUTH_COOKIE_VALUES.AUTHENTICATED ||
    entryCookie === ENTRY_AUTH_COOKIE_VALUES.ACTIVATION_REQUIRED
  ) {
    return true;
  }
  if (hasSupabaseAuthCookie(cookies)) return true;

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

  const cookies = input?.cookies || input?.request?.cookies;
  const entryCookie = readCookieValue(cookies, ENTRY_AUTH_COOKIE);

  if (
    entryCookie === ENTRY_AUTH_COOKIE_VALUES.ACTIVATION_REQUIRED ||
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

  const value = getEntryCookieValueForState(state);
  if (value) {
    document.cookie = `${ENTRY_AUTH_COOKIE}=${value}; path=/; max-age=2592000; SameSite=Lax`;
    return;
  }

  document.cookie = `${ENTRY_AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function writeClientEntrySessionState(session: any, input: any = {}) {
  if (typeof document === 'undefined') return;

  const state = getEntryState({
    ...input,
    session,
  });
  writeClientEntryState(state);
}
