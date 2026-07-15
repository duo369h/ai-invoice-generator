const runtime = globalThis.__corviozRouteRuntime__ ||= {
  calls: [],
  config: {},
};

export function configureRouteRuntime(config) {
  runtime.calls.length = 0;
  runtime.config = config;
}

export function getRouteRuntimeCalls() {
  return [...runtime.calls];
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

export function getIp() { return '127.0.0.1'; }
export async function rateLimitAuthenticated() { return { success: true }; }
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
export async function writeAuditLog() {}
export async function recordServerGrowthEvent() {}
export async function trackProfileMetric() {}
export async function recordProductAnalyticsEvent() {}
export async function getFirstRevenueLoopContext() { return { decision: { canCreateQuote: true }, loop: {}, quote: null }; }
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
    rpc(name) {
      call(`persist:${name}`);
      return result(runtime.config.persisted, runtime.config.persistenceError);
    },
  };
}

function createQuery(kind, table) {
  const state = { kind, table };
  const chain = {
    select() { return chain; },
    eq() { return chain; },
    order() { return chain; },
    limit() { return chain; },
    update() { return chain; },
    insert() {
      if (table === 'quotes' || table === 'invoices') call(`persist:${table}`);
      if (table === 'analytics_activation_claims') call('helper_claim_insert');
      if (table === 'analytics_activation_claims' && runtime.config.helperClaimThrows) throw new Error('claim insert threw');
      return chain;
    },
    single() { return queryResult(state); },
    maybeSingle() { return queryResult(state); },
    then(resolve, reject) { return queryResult(state).then(resolve, reject); },
  };
  return chain;
}

function queryResult({ kind, table }) {
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
