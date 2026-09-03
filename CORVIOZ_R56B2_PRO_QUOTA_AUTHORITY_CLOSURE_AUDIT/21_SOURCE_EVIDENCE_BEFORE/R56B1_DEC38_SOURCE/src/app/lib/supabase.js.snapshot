import { createClient } from '@supabase/supabase-js';
import { hashPortalToken } from './security.js';
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
  const serviceSupabase = supabaseClient;
  const normalizedPlan = String(plan || "free").toLowerCase();
  const limit = normalizedPlan === "starter" ? 30 : 5;
  const documentsLimit = ["pro", "agency", "studio"].includes(normalizedPlan) ? Infinity : limit;

  // Execute secured service_role RPC check_and_create_quote
  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc("check_and_create_quote", {
    p_user_id: userId,
    p_quote_payload: payload
  });

  // A successful atomic insert is authoritative when the RPC adapter returns
  // both the inserted row and a post-return error. Never turn a persisted
  // document into a false quota rejection; only an error without a row is a
  // creation failure.
  if (rpcError && !rpcData) {
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
  const serviceSupabase = supabaseClient;
  const normalizedPlan = String(plan || "free").toLowerCase();
  const limit = normalizedPlan === "starter" ? 30 : 5;
  const documentsLimit = ["pro", "agency", "studio"].includes(normalizedPlan) ? Infinity : limit;

  // Execute secured service_role RPC check_and_create_invoice
  const { data: rpcData, error: rpcError } = await serviceSupabase.rpc("check_and_create_invoice", {
    p_user_id: userId,
    p_invoice_payload: payload
  });

  // Keep the Quote/Invoice boundary symmetric: a returned document row means
  // the atomic creation succeeded, even if the RPC adapter also reports a
  // post-return error. Quota rejection is only valid when no row is returned.
  if (rpcError && !rpcData) {
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
  const serviceSupabase = supabaseClient;
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
