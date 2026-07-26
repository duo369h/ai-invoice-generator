import { createClient } from '@supabase/supabase-js';
import { hashPortalToken } from './security';
import { resolveInvoicePaymentReadModel } from '../../core/revenue/invoicePaymentState.js';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseAuthStorageKey() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const projectRef = hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

function parseCookieHeader(headerValue = '') {
  return headerValue
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf('=');
      if (separator === -1) return cookies;
      const name = part.slice(0, separator);
      const value = part.slice(separator + 1);
      cookies.set(name, value);
      return cookies;
    }, new Map());
}

function getRequestCookie(request, name) {
  const nextCookie = request.cookies?.get?.(name)?.value;
  if (nextCookie) return nextCookie;

  const headerCookies = parseCookieHeader(request.headers.get('cookie') || '');
  return headerCookies.get(name) || null;
}

function getStoredAuthSession(request, storageKey) {
  const directCookie = getRequestCookie(request, storageKey);
  if (directCookie) return decodeURIComponent(directCookie);

  const chunks = [];
  for (let index = 0; ; index += 1) {
    const chunk = getRequestCookie(request, `${storageKey}.${index}`);
    if (!chunk) break;
    chunks.push(chunk);
  }

  return chunks.length > 0 ? decodeURIComponent(chunks.join('')) : null;
}

function getStoredAccessToken(request, storageKey) {
  const session = getStoredAuthSession(request, storageKey);
  if (!session) return '';

  try {
    const parsed = JSON.parse(session);
    return parsed?.access_token || '';
  } catch (_) {
    return '';
  }
}

function getRequestBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization) return { hasBearer: false, accessToken: '' };

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return { hasBearer: /^Bearer\b/i.test(authorization.trim()), accessToken: '' };

  return { hasBearer: true, accessToken: match[1].trim() };
}

export function createRequestSupabaseClient(request) {
  const storageKey = getSupabaseAuthStorageKey();
  if (!isSupabaseConfigured() || !storageKey) return null;
  const bearer = getRequestBearerToken(request);
  const accessToken = bearer.hasBearer ? bearer.accessToken : getStoredAccessToken(request, storageKey);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      ...(accessToken
        ? {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
          }
        : {}),
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey,
        storage: {
          getItem: (key) => {
            if (key !== storageKey) return null;
            if (bearer.hasBearer) return null;
            return getStoredAuthSession(request, storageKey);
          },
          setItem: () => {},
          removeItem: () => {},
        },
      },
    }
  );
}

export function createPublicSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function getRequestUser(request) {
  const supabase = createRequestSupabaseClient(request);
  if (!supabase) {
    if (!isSupabaseConfigured() && process.env.NODE_ENV === 'production') {
      return { mode: 'unconfigured', supabase: null, user: null };
    }
    if (process.env.NODE_ENV === 'production') {
      return { mode: 'unauthenticated', supabase: null, user: null };
    }
    return { mode: 'unauthenticated', supabase: null, user: null };
  }

  const bearer = getRequestBearerToken(request);
  const { data, error } = await supabase.auth.getUser(bearer.hasBearer ? bearer.accessToken : undefined);
  if (error || !data?.user) {
    if (process.env.NODE_ENV === 'production') {
      return { mode: 'unauthenticated', supabase: null, user: null };
    }
    return { mode: 'unauthenticated', supabase: null, user: null };
  }

  return { mode: 'supabase', supabase, user: data.user };
}

export function mapSupabaseInvoice(row) {
  // SAFE-03B2A-R1: all payment amount normalization and payment_status
  // derivation is centralized in resolveInvoicePaymentReadModel. This
  // function must not re-implement its own cents normalization.
  const readModel = resolveInvoicePaymentReadModel(row);

  return {
    ...row,
    object: 'invoice',
    status: row.status || 'draft',
    currency: (row.currency || 'USD').toLowerCase(),
    discount_rate: Number(row.discount_rate || 0),
    tax_rate: Number(row.tax_rate || 0),
    payment_link: row.payment_link || '',
    invoice_kind: readModel.invoice_kind,
    payment_status: readModel.payment_status,
    amount_paid_cents: readModel.amount_paid_cents,
    amount_due_cents: readModel.amount_due_cents,
  };
}

export async function resolveSupabasePortalToken(supabase, token) {
  const tokenHash = hashPortalToken(token);
  const { data, error } = await supabase
    .from('portal_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return null;
  return data;
}

export async function getSupabaseQuota(supabase, userId, plan = 'free') {
  const normalizedPlan = String(plan || 'free').toLowerCase() === 'pro' ? 'pro' : 'free';
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthStart = `${currentMonth}-01T00:00:00.000Z`;

  const { count: invoicesUsed = 0 } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart);

  const { data: usage } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  const limits = {
    free: { invoices: 5, ai: 3 },
    pro: { invoices: 999999, ai: 100 },
  };

  const currentLimits = limits[normalizedPlan];
  const aiUsed = usage?.ai_parses_used || 0;

  return {
    plan: normalizedPlan,
    invoicesUsed: invoicesUsed || 0,
    invoicesLimit: currentLimits.invoices,
    invoicesAllowed: (invoicesUsed || 0) < currentLimits.invoices,
    aiUsed,
    aiLimit: currentLimits.ai,
    aiAllowed: aiUsed < currentLimits.ai,
  };
}

export async function incrementSupabaseAiUsage(supabase, userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('usage')
      .update({ ai_parses_used: (existing.ai_parses_used || 0) + 1 })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .eq('month', currentMonth);
    return;
  }

  await supabase.from('usage').insert({
    user_id: userId,
    month: currentMonth,
    invoices_created: 0,
    ai_parses_used: 1,
  });
}

export async function incrementSupabaseInvoiceUsage(supabase, userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('usage')
      .update({ invoices_created: (existing.invoices_created || 0) + 1 })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .eq('month', currentMonth);
    return;
  }

  await supabase.from('usage').insert({
    user_id: userId,
    month: currentMonth,
    invoices_created: 1,
    ai_parses_used: 0,
  });
}
