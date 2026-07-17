export function safeAuthRedirect(value, locationObject = typeof window === 'undefined' ? null : window.location) {
  const fallback = '/dashboard';
  if (!value || typeof value !== 'string' || !locationObject?.origin) return fallback;
  if (/[\u0000-\u001F\u007F]/.test(value)) return fallback;

  const candidate = value.trim();
  if (
    !candidate.startsWith('/')
    || candidate.startsWith('//')
    || candidate.includes('\\')
    || /%5c/i.test(candidate)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, locationObject.origin);
    if (parsed.origin !== locationObject.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch (_) {
    return fallback;
  }
}

export function startDocumentNavigation(target, locationObject = typeof window === 'undefined' ? null : window.location) {
  if (!locationObject || typeof locationObject.assign !== 'function') {
    throw new Error('Document navigation is unavailable.');
  }
  locationObject.assign(target);
}
