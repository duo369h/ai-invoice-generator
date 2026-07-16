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
  return runtime.updates.map((entry) => ({ ...entry, values: { ...entry.values } }));
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
  if (runtime.config.operation === 'delete') call(`rate-limit:${scope}:${userId}`);
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
export async function getSupabaseQuota() { return { invoicesAllowed: true }; }
export function mapSupabaseInvoice(data) { return { ...data, mapped: true }; }
export async function incrementSupabaseInvoiceUsage() {}
export async function createSupabasePortalToken() { return ''; }
export async function writeAuditLog(_client, entry) {
  if (runtime.config.operation === 'delete') {
    runtime.auditLogs.push({ ...entry });
    call(`audit:${entry.action}`);
    if (runtime.config.auditLogThrows) throw new Error('audit log unavailable');
  }
}
export async function recordServerGrowthEvent() {}
export async function trackProfileMetric() {}
export async function recordProductAnalyticsEvent() {}
export async function getFirstRevenueLoopContext() {
  if (runtime.config.firstRevenueLoopContextError) throw runtime.config.firstRevenueLoopContextError;
  return runtime.config.firstRevenueLoopContext || { decision: { canCreateQuote: true }, loop: {}, quote: null };
}
export function canTransitionFirstRevenueQuote() { return { allowed: true }; }
export function injectInvoiceEnhancement() {}
export function getDecision() { return { output: { decision: 'mock' } }; }
export function assertCoreDecisionSource() {}
export function getSiteUrl() { return 'http://localhost:3000'; }
export function getUserEntitlements() { return { invoice: true }; }

export async function claimFirstActivationEvent({ eventName }) {
  call(`claim:${eventName}`);
  call('claim_insert:analytics_activation_claims');
  if (runtime.config.claim === 'throw') throw new Error('claim service unavailable');
  return { claimed: runtime.config.claim === 'granted' };
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
  const state = { kind, table, operation: null, filters: {} };
  const chain = {
    select(columns = '*') {
      if (state.operation === 'delete') call(`select:${table}:${columns}`);
      return chain;
    },
    eq(column, value) {
      if (state.operation === 'delete') {
        state.filters[column] = value;
        call(`eq:${table}:${column}:${value}`);
      }
      return chain;
    },
    order() { return chain; },
    limit() { return chain; },
    update(values) {
      state.operation = 'update';
      runtime.updates.push({ kind, table, values });
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
      if (state.operation === 'delete') call(`single:${table}`);
      return queryResult(state);
    },
    maybeSingle() {
      if (state.operation === 'delete') call(`maybeSingle:${table}`);
      return queryResult(state);
    },
    then(resolve, reject) { return queryResult(state).then(resolve, reject); },
  };
  return chain;
}

function queryResult({ kind, table, operation, filters }) {
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
    if (Array.isArray(runtime.config.invoiceRecords)) {
      const record = runtime.config.invoiceRecords.find((invoice) => invoice.id === filters.id);
      if (!record) return result(null);
      if (filters.user_id === undefined || filters.user_id === record.user_id) {
        return result({ id: record.id });
      }
      return result(null);
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
