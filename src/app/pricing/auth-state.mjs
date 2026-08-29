export const PRICING_AUTH_STATUS = Object.freeze({
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
});

export function resolvePricingAuthStatus(session, { loading = false, error = false } = {}) {
  if (loading) return PRICING_AUTH_STATUS.LOADING;
  if (error) return PRICING_AUTH_STATUS.ERROR;
  return session ? PRICING_AUTH_STATUS.AUTHENTICATED : PRICING_AUTH_STATUS.UNAUTHENTICATED;
}

export function getPricingCheckoutAction({ planId, authStatus, session }) {
  if (planId === 'free') return 'free';
  if (!['starter', 'pro'].includes(planId)) return 'invalid';
  if (authStatus === PRICING_AUTH_STATUS.LOADING) return 'wait';
  if (authStatus === PRICING_AUTH_STATUS.ERROR) return 'blocked';
  if (authStatus === PRICING_AUTH_STATUS.AUTHENTICATED && session) return 'checkout';
  if (authStatus === PRICING_AUTH_STATUS.UNAUTHENTICATED && !session) return 'signup';
  return 'blocked';
}

export function isPricingPaidCtaDisabled(authStatus, checkoutLoading) {
  return checkoutLoading
    || authStatus === PRICING_AUTH_STATUS.LOADING
    || authStatus === PRICING_AUTH_STATUS.ERROR;
}
