const runtime = globalThis.__corviozRouteRuntime__ ||= {
  calls: [],
  auditLogs: [],
  inserts: [],
  rpcCalls: [],
  updates: [],
  config: {},
};
runtime.auditLogs ||= [];
runtime.inserts ||= [];
runtime.rpcCalls ||= [];
runtime.updates ||= [];

export function configureRouteRuntime(config) {
  runtime.calls.length = 0;
  runtime.auditLogs.length = 0;
  runtime.inserts.length = 0;
  runtime.rpcCalls.length = 0;
  runtime.updates.length = 0;
  runtime.config = config;
}

export function getRouteRuntimeCalls() {
  return [...runtime.calls];
}

export function getRouteRuntimeAuditLogs() {
  return runtime.auditLogs.map((entry) => ({ ...entry }));
}

export function getRouteRuntimeInserts() {
  return runtime.inserts.map((entry) => ({ ...entry, values: { ...entry.values } }));
}

export function getRouteRuntimeRpcCalls() {
  return runtime.rpcCalls.map((entry) => ({ ...entry, args: { ...entry.args } }));
}

export function getRouteRuntimeUpdates() {
  return runtime.updates.map((entry) => ({
    ...entry,
    values: { ...entry.values },
    filters: { ...entry.filters },
  }));
}

function call(name) {
  runtime.calls.push(name);
}

function result(data = null, error = null, extra = {}) {
  return Promise.resolve({ data, error, ...extra });
}

export class NextResponse {
  static json(body, init = {}) {
    return new Response(JSON.stringify(body), {
      status: init.status || 200,
      headers: { 'content-type': 'application/json' },
    });
  }
}

export async function getRequestUser() {
  if (runtime.config.logRequestFlow) call('auth:session');
  const context = runtime.config.context;
  if (context?.mode === 'supabase' && !context.supabase) {
    return { ...context, supabase: createClient('request') };
  }
  return context;
}

export function requestContextResponse(context) {
  if (context?.mode === 'unauthenticated') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export function authRequiredResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function getIp(request) {
  return request?.headers?.get('x-forwarded-for') || '127.0.0.1';
}
export async function rateLimitAuthenticated(scope, userId) {
  if (runtime.config.operation === 'delete' || runtime.config.logRequestFlow) {
    call(`rate-limit:${scope}:${userId}`);
  }
  return runtime.config.rateLimitResult || { success: true };
}
export function validateQuotePayload(body) { return body; }
export function validateInvoicePayload(body) { return body; }
export function validationResponse() { return null; }
export function validateObject(body) { return body; }
export function enumValue(value) { return value; }

export function createServiceSupabaseClient() {
  if (runtime.config.serviceClientMissing) return null;
  return createClient('service');
}
export async function cookies() { return { get: () => undefined }; }

export async function ensureProfile() { return { plan: runtime.config.plan || 'pro' }; }
export async function getSupabaseQuota() {
  if (runtime.config.logSideEffects) call('quota:invoice');
  return runtime.config.quota || { invoicesAllowed: true };
}
export async function getDocumentQuota() {
  if (runtime.config.logSideEffects) call('quota:document');
  return runtime.config.quota || { documentsAllowed: true };
}
export function mapSupabaseInvoice(data) { return { ...data, mapped: true }; }
export async function incrementSupabaseInvoiceUsage() {
  if (runtime.config.logSideEffects) call('usage:invoice:increment');
}
export async function createSupabasePortalToken() {
  if (runtime.config.logSideEffects) call('portal-token:create');
  return runtime.config.portalToken || '';
}
export async function writeAuditLog(_client, entry) {
  if (runtime.config.operation === 'delete' || runtime.config.logSideEffects) {
    runtime.auditLogs.push({ ...entry });
    call(`audit:${entry.action}`);
    if (runtime.config.auditLogThrows) throw new Error('audit log unavailable');
  }
}
export async function recordServerGrowthEvent() {}
export async function trackProfileMetric(_client, _userId, metric) {
  if (runtime.config.logSideEffects) call(`metric:${metric}`);
}
export async function recordProductAnalyticsEvent({ eventName }) {
  if (runtime.config.logSideEffects) call(`analytics:${eventName}`);
}
export async function getFirstRevenueLoopContext() {
  if (runtime.config.logSideEffects) call('first-revenue:context');
  if (runtime.config.firstRevenueLoopContextError) throw runtime.config.firstRevenueLoopContextError;
  return runtime.config.firstRevenueLoopContext || { decision: { canCreateQuote: true }, loop: {}, quote: null };
}
export function canTransitionFirstRevenueQuote() {
  if (runtime.config.logSideEffects) call('first-revenue:transition');
  return runtime.config.firstRevenueTransition || { allowed: true };
}
export function injectInvoiceEnhancement() {}
export function getDecision() { return { output: { decision: 'mock' } }; }
export function assertCoreDecisionSource() {}
export function getSiteUrl() { return 'http://localhost:3000'; }
export function getUserEntitlements() { return runtime.config.entitlements || { invoice: true }; }

export async function claimFirstActivationEvent({ eventName }) {
  call(`claim:${eventName}`);
  call('claim_insert:analytics_activation_claims');
  if (runtime.config.claim === 'throw') throw new Error('claim service unavailable');
  return { claimed: runtime.config.claim === 'granted' };
}

function atomicCreationError(kind, error, plan) {
  const message = error?.message || 'Unknown database error';
  if (message.includes('CLIENT_NOT_OWNED')) {
    const ownershipError = new Error('Client does not belong to the authenticated user.');
    ownershipError.code = 'CLIENT_NOT_OWNED';
    ownershipError.status = 403;
    return ownershipError;
  }
  if (message.includes('QUOTA_EXCEEDED')) {
    const limit = String(plan || '').toLowerCase() === 'starter' ? 30 : 5;
    const quotaError = new Error(`You have reached your limit of ${limit} documents for this billing cycle. Please upgrade.`);
    quotaError.code = 'QUOTA_EXCEEDED';
    quotaError.status = 403;
    return quotaError;
  }
  const databaseError = new Error(`Atomic ${kind} creation failed: ${message}`);
  databaseError.code = 'DATABASE_ERROR';
  databaseError.status = 500;
  return databaseError;
}

async function createDocumentWithAtomicQuota(kind, supabaseClient, userId, plan, payload) {
  const rpcName = kind === 'quote' ? 'check_and_create_quote' : 'check_and_create_invoice';
  const payloadName = kind === 'quote' ? 'p_quote_payload' : 'p_invoice_payload';
  const { data, error } = await supabaseClient.rpc(rpcName, {
    p_user_id: userId,
    [payloadName]: payload,
  });
  if (error && !data) throw atomicCreationError(kind, error, plan);
  if (!data) {
    const missingDataError = new Error(`Atomic ${kind} creation returned no document record.`);
    missingDataError.code = 'DATABASE_ERROR';
    missingDataError.status = 500;
    throw missingDataError;
  }
  const normalizedPlan = String(plan || 'free').toLowerCase();
  const documentsLimit = ['pro', 'agency', 'studio'].includes(normalizedPlan)
    ? Infinity
    : normalizedPlan === 'starter' ? 30 : 5;
  return { data, quota: { documentsAllowed: true, documentsLimit } };
}

export function createQuoteWithAtomicQuota(supabaseClient, userId, plan, payload) {
  return createDocumentWithAtomicQuota('quote', supabaseClient, userId, plan, payload);
}

export function createInvoiceWithAtomicQuota(supabaseClient, userId, plan, payload) {
  return createDocumentWithAtomicQuota('invoice', supabaseClient, userId, plan, payload);
}

function createClient(kind) {
  return {
    from(table) {
      return createQuery(kind, table);
    },
    rpc(name, args) {
      call(`persist:${name}`);
      runtime.rpcCalls.push({ kind, name, args });
      return result(runtime.config.persisted, runtime.config.persistenceError);
    },
  };
}

function createQuery(kind, table) {
  const state = { kind, table, operation: null, filters: {}, values: null };
  const chain = {
    select(columns = '*') {
      if (state.operation === null) state.operation = 'select';
      if (state.operation === 'delete' || runtime.config.logDatabaseCalls) {
        call(`select:${kind}:${table}:${columns}`);
      }
      return chain;
    },
    eq(column, value) {
      state.filters[column] = value;
      if (state.operation === 'delete' || runtime.config.logDatabaseCalls) {
        call(`eq:${table}:${column}:${value}`);
      }
      return chain;
    },
    order() { return chain; },
    limit() { return chain; },
    update(values) {
      state.operation = 'update';
      state.values = values;
      if (runtime.config.logDatabaseCalls) call(`update:${kind}:${table}`);
      runtime.updates.push({ kind, table, values, filters: state.filters });
      return chain;
    },
    delete() {
      state.operation = 'delete';
      call(`delete:${kind}:${table}`);
      return chain;
    },
    insert(values) {
      state.operation = 'insert';
      if (table === 'quotes' || table === 'invoices') call(`persist:${table}`);
      if (table === 'quotes' || table === 'invoices') runtime.inserts.push({ kind, table, values });
      if (table === 'analytics_activation_claims') call('helper_claim_insert');
      if (table === 'analytics_activation_claims' && runtime.config.helperClaimThrows) throw new Error('claim insert threw');
      return chain;
    },
    single() {
      if (state.operation === 'delete' || runtime.config.logDatabaseCalls) call(`single:${table}`);
      return queryResult(state);
    },
    maybeSingle() {
      if (state.operation === 'delete' || runtime.config.logDatabaseCalls) call(`maybeSingle:${table}`);
      return queryResult(state);
    },
    then(resolve, reject) { return queryResult(state).then(resolve, reject); },
  };
  return chain;
}

function matchingRecord(records, filters) {
  if (!Array.isArray(records)) return null;
  return records.find((record) => Object.entries(filters).every(
    ([column, value]) => record[column] === value
  )) || null;
}

function queryResult({ kind, table, operation, filters, values }) {
  if (table === 'quotes' && operation === 'select' && Array.isArray(runtime.config.quoteRecords)) {
    if (runtime.config.quoteLookupError) return result(null, runtime.config.quoteLookupError);
    return result(matchingRecord(runtime.config.quoteRecords, filters));
  }
  if (table === 'quotes' && operation === 'update') {
    if (runtime.config.quoteUpdateError) return result(null, runtime.config.quoteUpdateError);
    const records = runtime.config.quoteWriteRecords || runtime.config.quoteRecords;
    const record = matchingRecord(records, filters);
    return result(record ? { ...record, ...values } : null);
  }
  if (table === 'invoices' && operation === 'select' && Array.isArray(runtime.config.invoiceRecords)) {
    if (runtime.config.operation === 'get') return result(runtime.config.list || []);
    if (runtime.config.invoiceLookupError) return result(null, runtime.config.invoiceLookupError);
    return result(matchingRecord(runtime.config.invoiceRecords, filters));
  }
  if (table === 'invoices' && operation === 'update') {
    if (runtime.config.invoiceUpdateError) return result(null, runtime.config.invoiceUpdateError);
    const records = runtime.config.invoiceWriteRecords || runtime.config.invoiceRecords;
    const record = matchingRecord(records, filters);
    return result(record ? { ...record, ...values } : null);
  }
  if (table === 'quotes' && operation === 'delete') {
    if (runtime.config.quoteDeleteError) return result(null, runtime.config.quoteDeleteError);
    if (Array.isArray(runtime.config.quoteRecords)) {
      const record = runtime.config.quoteRecords.find((quote) => quote.id === filters.id);
      if (!record) return result(null);
      if (filters.user_id === undefined || filters.user_id === record.user_id) {
        return result({ id: record.id });
      }
      return result(null);
    }
    return result(runtime.config.deletedQuote, null);
  }
  if (table === 'invoices' && operation === 'delete') {
    if (runtime.config.deleteError) return result(null, runtime.config.deleteError);
    const records = runtime.config.invoiceWriteRecords || runtime.config.invoiceRecords;
    if (Array.isArray(records)) {
      const record = matchingRecord(records, filters);
      return result(record ? { id: record.id } : null);
    }
    return result(runtime.config.deletedInvoice, null);
  }
  if (kind === 'service' && table === 'profiles') return result({ plan: runtime.config.plan || 'pro' });
  if (table === 'analytics_events') return result(null, null, { count: 0 });
  if (table === 'quotes' && runtime.config.operation === 'get') return result(runtime.config.list || []);
  if (table === 'invoices' && runtime.config.operation === 'get') return result(runtime.config.list || []);
  if (table === 'analytics_activation_claims') return result(null, runtime.config.helperClaimError);
  if ((table === 'quotes' || table === 'invoices') && runtime.config.existingDocuments) {
    return result(runtime.config.existingDocuments[table] ? { id: `${table}-1` } : null);
  }
  if (table === 'quotes' || table === 'invoices') return result(runtime.config.persisted, runtime.config.persistenceError);
  return result(null);
}
