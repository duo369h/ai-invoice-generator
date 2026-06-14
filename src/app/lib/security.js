import crypto from 'crypto';
import { NextResponse } from 'next/server';

const SAFE_TEXT_REPLACEMENTS = [
  [/</g, '&lt;'],
  [/>/g, '&gt;'],
  [/"/g, '&quot;'],
  [/'/g, '&#39;'],
];

const PAYMENT_HOST_ALLOWLIST = [
  'stripe.com',
  'checkout.stripe.com',
  'buy.stripe.com',
  'paypal.com',
  'www.paypal.com',
  'paypal.me',
  'lemonsqueezy.com',
  'buy.lemonsqueezy.com',
];

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

export function isDemoModeAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';
}

export function failClosedResponse(resource = 'resource') {
  return NextResponse.json(
    { error: `${resource} is unavailable because production persistence is not configured.` },
    { status: 503 }
  );
}

export function sanitizePlainText(value, maxLength = 2000) {
  return String(value || '')
    .trim()
    .slice(0, maxLength)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s{3,}/g, ' ')
    .replace(/[<>"']/g, (char) => {
      if (char === '<') return '&lt;';
      if (char === '>') return '&gt;';
      if (char === '"') return '&quot;';
      return '&#39;';
    });
}

export function hasSpamSignals(...values) {
  const combined = values.map((value) => String(value || '')).join(' ').toLowerCase();
  const linkCount = (combined.match(/https?:\/\//g) || []).length;
  return (
    linkCount > 2 ||
    /(free money|crypto giveaway|casino|viagra|loan offer|telegram\.me|bit\.ly|tinyurl)/i.test(combined)
  );
}

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

function hostMatchesAllowlist(hostname, allowlist) {
  const host = hostname.toLowerCase();
  return allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

export function safeUrl(value, { payment = false, maxLength = 500 } = {}) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.length > maxLength) return '';

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return '';
    if (isPrivateHostname(parsed.hostname)) return '';
    if (payment && !hostMatchesAllowlist(parsed.hostname, PAYMENT_HOST_ALLOWLIST)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

export function normalizeUrlList(items, options = {}) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const next = { ...item };
    if (next.url !== undefined) next.url = safeUrl(next.url, options);
    if (next.link !== undefined) next.link = safeUrl(next.link, options);
    return next;
  });
}

export function generatePortalToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashPortalToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export function defaultPortalExpiry() {
  const expires = new Date();
  expires.setDate(expires.getDate() + 90);
  return expires.toISOString();
}

export function getIp(request) {
  return (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1')
    .split(',')[0]
    .trim();
}
