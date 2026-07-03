export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.corvioz.com').replace(/\/$/, '');
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
