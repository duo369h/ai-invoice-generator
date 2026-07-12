import { createClient } from '@supabase/supabase-js';
import { defaultPortalExpiry, generatePortalToken, hashPortalToken } from './security';

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

export function createRequestSupabaseClient(request) {
  const storageKey = getSupabaseAuthStorageKey();
  if (!isSupabaseConfigured() || !storageKey) return null;
  const accessToken = getStoredAccessToken(request, storageKey);

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

export function createServiceSupabaseClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
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

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    if (process.env.NODE_ENV === 'production') {
      return { mode: 'unauthenticated', supabase: null, user: null };
    }
    return { mode: 'unauthenticated', supabase: null, user: null };
  }

  return { mode: 'supabase', supabase, user: data.user };
}

export async function ensureProfile(supabase, user) {
  const email = user.email || '';
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    email.split('@')[0] ||
    'User';

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email,
      name,
      plan: 'free',
    })
    .select('*')
    .single();

  if (error) throw error;

  // Dynamically import to prevent circular dependency: supabase.js <=> demo-data.js
  try {
    const { seedDemoData } = await import('./demo-data');
    await seedDemoData(supabase, user.id, email, name);
  } catch (seedErr) {
    console.error('Failed to seed demo data on user registration:', seedErr);
  }

  try {
    const { sendWelcomeEmail } = await import('./email');
    await sendWelcomeEmail(email, name);
  } catch (emailErr) {
    console.error('Failed to send welcome email on registration:', emailErr);
  }

  return data;
}

export function mapSupabaseInvoice(row) {
  return {
    ...row,
    object: 'invoice',
    status: row.status || 'draft',
    currency: (row.currency || 'USD').toLowerCase(),
    discount_rate: Number(row.discount_rate || 0),
    tax_rate: Number(row.tax_rate || 0),
    payment_link: row.payment_link || '',
  };
}

export async function createSupabasePortalToken(supabase, {
  ownerId,
  resourceType,
  resourceId,
  scope = 'view:comment',
  expiresAt = defaultPortalExpiry(),
}) {
  const writer = createServiceSupabaseClient() || supabase;
  const token = generatePortalToken();
  const tokenHash = hashPortalToken(token);

  const { error } = await writer.from('portal_tokens').insert({
    token_hash: tokenHash,
    owner_id: ownerId,
    resource_type: resourceType,
    resource_id: resourceId,
    scope,
    expires_at: expiresAt,
  });

  if (error) throw error;
  return token;
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

export async function writeAuditLog(supabase, {
  userId,
  action,
  resourceType,
  resourceId = null,
  ip = '',
}) {
  const writer = createServiceSupabaseClient() || supabase;
  if (!writer || !userId || !action || !resourceType) return;

  const { error } = await writer.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
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

export async function trackProfileMetric(supabase, userId, field) {
  const writer = createServiceSupabaseClient() || supabase;
  if (!writer || !userId) return;

  try {
    const { data: profile } = await writer
      .from('profiles')
      .select('created_at, first_invoice_created_at, first_client_added_at, invoice_sent_timestamp, quote_sent_timestamp, time_to_first_export, time_to_first_client_response')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;

    const updates = {};
    const nowStr = new Date().toISOString();
    const createdTime = new Date(profile.created_at).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));

    if (field === 'first_invoice_created_at' && !profile.first_invoice_created_at) {
      updates.first_invoice_created_at = nowStr;
    }
    if (field === 'first_client_added_at' && !profile.first_client_added_at) {
      updates.first_client_added_at = nowStr;
    }
    if (field === 'invoice_sent_timestamp') {
      updates.invoice_sent_timestamp = nowStr;
    }
    if (field === 'quote_sent_timestamp') {
      updates.quote_sent_timestamp = nowStr;
    }
    if (field === 'time_to_first_export' && profile.time_to_first_export === null) {
      updates.time_to_first_export = durationSeconds;
    }
    if (field === 'time_to_first_client_response' && profile.time_to_first_client_response === null) {
      updates.time_to_first_client_response = durationSeconds;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await writer
        .from('profiles')
        .update({ ...updates, updated_at: nowStr })
        .eq('id', userId);
      if (error) throw error;
    }
  } catch (err) {
    console.error(`Failed to update profile metric ${field}:`, err);
  }
}

export async function recordServerGrowthEvent(supabase, {
  eventName,
  userId,
  sessionId = '',
  pagePath = '',
  pageLocation = '',
  source = 'system',
  properties = {}
}) {
  const ALLOWED_EVENTS = new Set(['invoice_created', 'invoice_sent', 'invoice_paid']);
  if (!ALLOWED_EVENTS.has(eventName)) {
    return;
  }

  const writer = createServiceSupabaseClient() || supabase;
  if (!writer) return;

  const payload = {
    event_name: eventName,
    session_id: sessionId,
    user_id: userId || null,
    page_path: pagePath,
    page_location: pageLocation,
    source: source,
    properties: {
      ...properties,
      timestamp: Date.now(),
      received_at: new Date().toISOString(),
    }
  };

  const { error } = await writer.from('growth_events').insert(payload);
  if (error) {
    console.error(`Failed to record server growth event ${eventName}:`, error);
  }
}
