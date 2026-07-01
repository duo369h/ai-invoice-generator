export type ConsentChoice = 'accepted' | 'declined' | 'unset';

export interface ConsentState {
  analytics: ConsentChoice;
  updatedAt: string | null;
  source: 'localStorage' | 'default';
}

const CONSENT_STORAGE_KEY = 'corvioz_tracking_consent';

function nowIso(): string {
  return new Date().toISOString();
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getConsentState(): ConsentState {
  if (!canUseStorage()) {
    return { analytics: 'unset', updatedAt: null, source: 'default' };
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === 'accepted' || raw === 'declined') {
      return { analytics: raw, updatedAt: window.localStorage.getItem(`${CONSENT_STORAGE_KEY}_updated_at`), source: 'localStorage' };
    }
  } catch (_) {
    return { analytics: 'unset', updatedAt: null, source: 'default' };
  }

  return { analytics: 'unset', updatedAt: null, source: 'default' };
}

export function acceptTrackingConsent(): ConsentState {
  if (canUseStorage()) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    window.localStorage.setItem(`${CONSENT_STORAGE_KEY}_updated_at`, nowIso());
  }
  return getConsentState();
}

export function declineTrackingConsent(): ConsentState {
  if (canUseStorage()) {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'declined');
    window.localStorage.setItem(`${CONSENT_STORAGE_KEY}_updated_at`, nowIso());
  }
  return getConsentState();
}

export function clearTrackingConsent(): ConsentState {
  if (canUseStorage()) {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.localStorage.removeItem(`${CONSENT_STORAGE_KEY}_updated_at`);
  }
  return getConsentState();
}

export function canActivateAnalytics(): boolean {
  const consent = getConsentState();
  return consent.analytics !== 'declined';
}
