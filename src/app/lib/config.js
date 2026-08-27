export const CANONICAL_PRODUCTION_ORIGIN = 'https://www.corvioz.com';
export const CANONICAL_OG_IMAGE_URL = `${CANONICAL_PRODUCTION_ORIGIN}/opengraph-image.png`;
export const CANONICAL_TWITTER_IMAGE_URL = `${CANONICAL_PRODUCTION_ORIGIN}/twitter-image.png`;

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_PRODUCTION_ORIGIN).replace(/\/$/, '');
}

export function getCanonicalSiteUrl() {
  return CANONICAL_PRODUCTION_ORIGIN;
}

export function getAuthBaseUrl() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return window.location.origin;
    }
  }

  return getSiteUrl();
}

export function getAuthCallbackUrl(next = '/dashboard') {
  return `${getAuthBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getSupportEmail() {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@corvioz.com';
}
