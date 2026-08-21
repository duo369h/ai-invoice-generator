import { createClient } from '@supabase/supabase-js';
import { defaultPortalExpiry, generatePortalToken, hashPortalToken } from './security.js';

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
    invoice_kind: row.invoice_kind || 'standard',
    payment_status: row.payment_status || (row.status === 'paid' ? 'paid' : 'unpaid'),
    amount_paid_cents: Number(row.amount_paid_cents || (row.status === 'paid' ? row.total : 0)),
    amount_due_cents: Number(row.amount_due_cents ?? (row.status === 'paid' ? 0 : row.total || 0)),
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

export function getClampedAnniversaryDate(anchorDateStr, targetYear, targetMonthIndex) {
  const anchor = new Date(anchorDateStr);
  const anchorDay = anchor.getUTCDate();
  const anchorHours = anchor.getUTCHours();
  const anchorMinutes = anchor.getUTCMinutes();
  const anchorSeconds = anchor.getUTCSeconds();
  const anchorMs = anchor.getUTCMilliseconds();

  const daysInMonth = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0)).getUTCDate();
  const clampedDay = Math.min(anchorDay, daysInMonth);

  return new Date(Date.UTC(targetYear, targetMonthIndex, clampedDay, anchorHours, anchorMinutes, anchorSeconds, anchorMs));
}

export function computeMonthlyAnniversaryCycle(anchorDateStr, nowStr = new Date().toISOString()) {
  const anchor = new Date(anchorDateStr);
  const now = new Date(nowStr);

  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth();

  let monthOffset = 0;
  let cycleStart = getClampedAnniversaryDate(anchorDateStr, anchorYear, anchorMonth + monthOffset);
  let cycleEnd = getClampedAnniversaryDate(anchorDateStr, anchorYear, anchorMonth + monthOffset + 1);

  while (now >= cycleEnd) {
    monthOffset++;
    cycleStart = cycleEnd;
    cycleEnd = getClampedAnniversaryDate(anchorDateStr, anchorYear, anchorMonth + monthOffset + 1);
  }

  return {
    cycleStart: cycleStart.toISOString(),
    cycleEnd: cycleEnd.toISOString(),
  };
}

export async function resolveUserBillingCycle(supabase, userId, plan = "free") {
  const normalizedPlan = String(plan || "free").toLowerCase();

  if (normalizedPlan === "starter" || normalizedPlan === "pro" || normalizedPlan === "studio") {
    try {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("current_period_start, current_period_end, status")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (sub?.current_period_start && sub?.current_period_end) {
        const now = new Date().getTime();
        const start = new Date(sub.current_period_start).getTime();
        const end = new Date(sub.current_period_end).getTime();
        if (now >= start && now <= end) {
          return {
            cycleStart: new Date(sub.current_period_start).toISOString(),
            cycleEnd: new Date(sub.current_period_end).toISOString(),
            cycleType: "subscription_period",
          };
        }
      }
    } catch (err) {
      console.warn("Error querying subscriptions for cycle:", err);
    }
  }

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", userId)
      .maybeSingle();

    const createdAt = profile?.created_at || new Date().toISOString();
    const anniversaryCycle = computeMonthlyAnniversaryCycle(createdAt);
    return {
      ...anniversaryCycle,
      cycleType: "account_anniversary",
    };
  } catch (err) {
    console.warn("Error querying profile for anniversary anchor:", err);
    const anniversaryCycle = computeMonthlyAnniversaryCycle(new Date().toISOString());
    return {
      ...anniversaryCycle,
      cycleType: "account_anniversary_fallback",
    };
  }
}

export async function getDocumentQuota(supabase, userId, plan = "free") {
  const normalizedPlan = String(plan || "free").toLowerCase();

  // Pro, Agency, and legacy Studio have unlimited quota
  if (normalizedPlan === "pro" || normalizedPlan === "agency" || normalizedPlan === "studio") {
    return {
      plan: normalizedPlan,
      documentsUsed: 0,
      documentsLimit: Infinity,
      documentsAllowed: true,
      invoicesUsed: 0,
      invoicesLimit: Infinity,
      invoicesAllowed: true,
      quotesUsed: 0,
      quotesLimit: Infinity,
      quotesAllowed: true,
      totalUsed: 0,
      cycleStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      cycleEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      cycleType: "unlimited",
    };
  }

  const limit = normalizedPlan === "starter" ? 30 : 5;
  const cycle = await resolveUserBillingCycle(supabase, userId, normalizedPlan);

  const [quotesResult, invoicesResult] = await Promise.all([
    supabase
      .from("quotes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", cycle.cycleStart)
      .lt("created_at", cycle.cycleEnd),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", cycle.cycleStart)
      .lt("created_at", cycle.cycleEnd),
  ]);

  const quotesCount = quotesResult.count || 0;
  const invoicesCount = invoicesResult.count || 0;
  const totalUsed = quotesCount + invoicesCount;

  return {
    plan: normalizedPlan,
    documentsUsed: totalUsed,
    documentsLimit: limit,
    documentsAllowed: totalUsed < limit,
    // Compatibility fields
    invoicesUsed: invoicesCount,
    invoicesLimit: limit,
    invoicesAllowed: totalUsed < limit,
    quotesUsed: quotesCount,
    quotesLimit: limit,
    quotesAllowed: totalUsed < limit,
    totalUsed,
    cycleStart: cycle.cycleStart,
    cycleEnd: cycle.cycleEnd,
    cycleType: normalizedPlan === "starter" ? "subscription" : "anniversary",
  };
}

export async function createQuoteWithAtomicQuota(supabaseClient, userId, plan, payload) {
  const serviceSupabase = createServiceSupabaseClient() || supabaseClient;
  const normalizedPlan = String(plan || "free").toLowerCase();
  const limit = normalizedPlan === "starter" ? 30 : 5;
  const documentsLimit = ["pro", "agency", "studio"].includes(normalizedPlan) ? Infinity : limit;

  // Execute secured service_role RPC check_and_create_quote
  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc("check_and_create_quote", {
    p_user_id: userId,
    p_quote_payload: payload
  });

  if (rpcError) {
    if (rpcError.message && rpcError.message.includes("CLIENT_NOT_OWNED")) {
      const ownershipErr = new Error("Client does not belong to the authenticated user.");
      ownershipErr.code = "CLIENT_NOT_OWNED";
      ownershipErr.status = 403;
      throw ownershipErr;
    }
    if (rpcError.message && rpcError.message.includes("QUOTA_EXCEEDED")) {
      const quotaExceededErr = new Error(`You have reached your limit of ${limit} documents for this billing cycle. Please upgrade.`);
      quotaExceededErr.code = "QUOTA_EXCEEDED";
      quotaExceededErr.status = 403;
      throw quotaExceededErr;
    }
    // FAIL CLOSED: No non-atomic fallback allowed for finite plans
    const dbErr = new Error(`Atomic quote creation failed: ${rpcError.message || "Unknown database error"}`);
    dbErr.code = "DATABASE_ERROR";
    dbErr.status = 500;
    throw dbErr;
  }

  if (!rpcData) {
    const dbErr = new Error("Atomic quote creation returned no document record.");
    dbErr.code = "DATABASE_ERROR";
    dbErr.status = 500;
    throw dbErr;
  }

  return { data: rpcData, quota: { documentsAllowed: true, documentsLimit } };
}

export async function createInvoiceWithAtomicQuota(supabaseClient, userId, plan, payload) {
  const serviceSupabase = createServiceSupabaseClient() || supabaseClient;
  const normalizedPlan = String(plan || "free").toLowerCase();
  const limit = normalizedPlan === "starter" ? 30 : 5;
  const documentsLimit = ["pro", "agency", "studio"].includes(normalizedPlan) ? Infinity : limit;

  // Execute secured service_role RPC check_and_create_invoice
  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc("check_and_create_invoice", {
    p_user_id: userId,
    p_invoice_payload: payload
  });

  if (rpcError) {
    if (rpcError.message && rpcError.message.includes("CLIENT_NOT_OWNED")) {
      const ownershipErr = new Error("Client does not belong to the authenticated user.");
      ownershipErr.code = "CLIENT_NOT_OWNED";
      ownershipErr.status = 403;
      throw ownershipErr;
    }
    if (rpcError.message && rpcError.message.includes("QUOTA_EXCEEDED")) {
      const quotaExceededErr = new Error(`You have reached your limit of ${limit} documents for this billing cycle. Please upgrade.`);
      quotaExceededErr.code = "QUOTA_EXCEEDED";
      quotaExceededErr.status = 403;
      throw quotaExceededErr;
    }
    // FAIL CLOSED: No non-atomic fallback allowed for finite plans
    const dbErr = new Error(`Atomic invoice creation failed: ${rpcError.message || "Unknown database error"}`);
    dbErr.code = "DATABASE_ERROR";
    dbErr.status = 500;
    throw dbErr;
  }

  if (!rpcData) {
    const dbErr = new Error("Atomic invoice creation returned no document record.");
    dbErr.code = "DATABASE_ERROR";
    dbErr.status = 500;
    throw dbErr;
  }

  return { data: rpcData, quota: { documentsAllowed: true, documentsLimit } };
}

export async function createInvoiceDraftFromApprovedQuote(supabaseClient, userId, plan, quoteId) {
  const serviceSupabase = createServiceSupabaseClient() || supabaseClient;
  const normalizedPlan = String(plan || 'free').toLowerCase();
  const documentsLimit = normalizedPlan === 'starter' ? 30 : ['pro', 'agency', 'studio'].includes(normalizedPlan) ? Infinity : 5;
  const { data, error } = await serviceSupabase.rpc('create_invoice_draft_from_approved_quote', {
    p_user_id: userId,
    p_quote_id: quoteId,
  });

  if (error) {
    const message = error.message || 'Approved Quote conversion failed.';
    const known = ['QUOTE_NOT_FOUND', 'QUOTE_NOT_APPROVED', 'QUOTE_ALREADY_CONVERTED', 'CLIENT_NOT_OWNED'];
    const code = known.find((value) => message.includes(value));
    if (code) {
      const conversionError = new Error(message);
      conversionError.code = code;
      conversionError.status = code === 'QUOTE_NOT_FOUND' ? 404 : 409;
      throw conversionError;
    }
    if (message.includes('QUOTA_EXCEEDED')) {
      const quotaError = new Error(`You have reached your limit of ${documentsLimit} documents for this billing cycle. Please upgrade.`);
      quotaError.code = 'QUOTA_EXCEEDED';
      quotaError.status = 403;
      throw quotaError;
    }
    const dbError = new Error(`Atomic approved Quote conversion failed: ${message}`);
    dbError.code = 'DATABASE_ERROR';
    dbError.status = 500;
    throw dbError;
  }
  if (!data?.invoice) {
    const dbError = new Error('Atomic approved Quote conversion returned no Invoice draft.');
    dbError.code = 'DATABASE_ERROR';
    dbError.status = 500;
    throw dbError;
  }
  return { data, quota: { documentsAllowed: true, documentsLimit } };
}


export async function trackProfileMetric(supabase, userId, field) {
  const writer = createServiceSupabaseClient() || supabase;
  if (!writer || !userId) return;

  try {
    const { data: profile } = await writer
      .from("profiles")
      .select("created_at, first_invoice_created_at, first_client_added_at, invoice_sent_timestamp, quote_sent_timestamp, time_to_first_export, time_to_first_client_response")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) return;

    const updates = {};
    const nowStr = new Date().toISOString();
    const createdTime = new Date(profile.created_at).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));

    if (field === "first_invoice_created_at" && !profile.first_invoice_created_at) {
      updates.first_invoice_created_at = nowStr;
    }
    if (field === "first_client_added_at" && !profile.first_client_added_at) {
      updates.first_client_added_at = nowStr;
    }
    if (field === "invoice_sent_timestamp") {
      updates.invoice_sent_timestamp = nowStr;
    }
    if (field === "quote_sent_timestamp") {
      updates.quote_sent_timestamp = nowStr;
    }
    if (field === "time_to_first_export" && profile.time_to_first_export == null) {
      updates.time_to_first_export = durationSeconds;
    }
    if (field === "time_to_first_client_response" && profile.time_to_first_client_response == null) {
      updates.time_to_first_client_response = durationSeconds;
    }

    if (Object.keys(updates).length > 0) {
      await writer.from("profiles").update(updates).eq("id", userId);
    }
  } catch (error) {
    console.error("Failed to track profile metric:", error);
  }
}

export async function recordServerGrowthEvent(supabase, {
  eventName,
  userId,
  sessionId = "",
  pagePath = "",
  pageLocation = "",
  source = "system",
  properties = {}
}) {
  const ALLOWED_EVENTS = new Set(["invoice_created", "invoice_sent", "invoice_paid"]);
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

  const { error } = await writer.from("growth_events").insert(payload);
  if (error) {
    console.error(`Failed to record server growth event ${eventName}:`, error);
  }
}

export async function getSupabaseQuota(supabase, userId, plan = "free") {
  const docQuota = await getDocumentQuota(supabase, userId, plan);

  return {
    plan: docQuota.plan,
    documentsUsed: docQuota.documentsUsed,
    documentsLimit: docQuota.documentsLimit,
    documentsAllowed: docQuota.documentsAllowed,
    invoicesUsed: docQuota.documentsUsed,
    invoicesLimit: docQuota.documentsLimit,
    invoicesAllowed: docQuota.documentsAllowed,
    quotesUsed: docQuota.documentsUsed,
    quotesLimit: docQuota.documentsLimit,
    quotesAllowed: docQuota.documentsAllowed,
    aiUsed: 0,
    aiLimit: 100,
    aiAllowed: true,
    cycleStart: docQuota.cycleStart,
    cycleEnd: docQuota.cycleEnd,
    cycleType: docQuota.cycleType,
  };
}

export async function incrementSupabaseInvoiceUsage(supabase, userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: existing } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage")
      .update({ invoices_created: (existing.invoices_created || 0) + 1 })
      .eq("id", existing.id)
      .eq("user_id", userId)
      .eq("month", currentMonth);
    return;
  }

  await supabase.from("usage").insert({
    user_id: userId,
    month: currentMonth,
    invoices_created: 1,
    ai_parses_used: 0,
  });
}
