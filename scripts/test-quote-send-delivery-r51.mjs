import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const routePath = path.join(root, 'src/app/api/quotes/[id]/send/route.js');

function loadRoute(customMocks = {}) {
  assert.equal(fs.existsSync(routePath), true, 'dedicated Quote Send route must exist');
  const source = fs.readFileSync(routePath, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const moduleRecord = { exports };
  const nextResponse = {
    json(body, init = {}) {
      return { status: init.status || 200, body, json: async () => body };
    },
  };
  const defaults = {
    getRequestUser: async () => ({ mode: 'supabase', user: OWNER, supabase: {} }),
    createServiceSupabaseClient: () => makeDb(),
    createSupabasePortalToken: async (_supabase, args) => {
      runtime.portalTokens.push(args);
      return 'secure-portal-token';
    },
    writeAuditLog: async (_supabase, entry) => runtime.audits.push(entry),
    recordServerGrowthEvent: async (_supabase, entry) => runtime.growth.push(entry),
    trackProfileMetric: async (_supabase, userId, field) => runtime.metrics.push({ userId, field }),
    rateLimitAuthenticated: async () => ({ success: true }),
    authRequiredResponse: () => nextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    getIp: () => '203.0.113.20',
    requestContextResponse: (context) => context?.mode === 'unauthenticated'
      ? nextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : null,
    validationResponse: () => null,
    recordProductAnalyticsEvent: async (entry) => runtime.analytics.push(entry),
    getUserEntitlements: (plan) => ({ client_portal: plan === 'pro' }),
    getSiteUrl: () => 'https://corvioz.example',
    sendQuoteSentEmail: async (to, quote, portalUrl, freelancerName, replyTo) => {
      runtime.mail.push({ to, quote, portalUrl, freelancerName, replyTo });
      return runtime.config.mailResult || { success: true, id: 'mail-1' };
    },
  };
  const mocks = { ...defaults, ...customMocks };
  const requireMock = (specifier) => {
    if (specifier.includes('next/server')) return { NextResponse: nextResponse };
    if (specifier.includes('lib/supabase-service')) return mocks;
    if (specifier.includes('lib/supabase')) return mocks;
    if (specifier.includes('lib/rate-limit')) return mocks;
    if (specifier.includes('lib/security')) return mocks;
    if (specifier.includes('lib/validation')) return mocks;
    if (specifier.includes('product-analytics-server')) return mocks;
    if (specifier.includes('lib/entitlements')) return mocks;
    if (specifier.includes('lib/config')) return mocks;
    if (specifier.includes('lib/email')) return mocks;
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  new Function('exports', 'require', 'module', '__filename', '__dirname', code)(
    exports,
    requireMock,
    moduleRecord,
    routePath,
    path.dirname(routePath),
  );
  return moduleRecord.exports;
}

const OWNER = { id: 'owner-1', email: 'photographer@example.com', user_metadata: { name: 'A <Photographer>' } };
const BASE_QUOTE = {
  id: 'quote-1',
  user_id: OWNER.id,
  status: 'draft',
  client_id: 'client-1',
  client_name: 'Client & Co <script>alert(1)</script>',
  client_email: 'client@example.com',
  client_address: '1 <Main> Street',
  quote_number: 'QT-001',
  items: [{ description: 'Shoot & edit <b>', quantity: 2, unit_price: 12500, amount: 25000 }],
  subtotal: 25000,
  discount_rate: 10,
  discount_amount: 2500,
  tax_rate: 5,
  tax_amount: 1125,
  total: 23625,
  currency: 'USD',
  notes: 'Terms <img src=x onerror=alert(1)>',
};

const runtime = { config: {}, mail: [], portalTokens: [], audits: [], growth: [], metrics: [], analytics: [], updates: [] };

function resetRuntime(config = {}) {
  runtime.config = config;
  for (const key of ['mail', 'portalTokens', 'audits', 'growth', 'metrics', 'analytics', 'updates']) runtime[key].length = 0;
}

function makeDb() {
  return {
    from(table) {
      const state = { table, op: 'select', filters: {}, values: null };
      const query = {
        select() { state.op = state.op === 'update' ? 'update' : 'select'; return query; },
        update(values) { state.op = 'update'; state.values = values; runtime.updates.push({ table, values, filters: { ...state.filters } }); return query; },
        eq(column, value) { state.filters[column] = value; return query; },
        in(column, value) { state.filters[column] = value; return query; },
        is(column, value) { state.filters[column] = value; return query; },
        maybeSingle: async () => {
          if (table === 'quotes' && state.op === 'select') {
            if (runtime.config.lookupError) return { data: null, error: runtime.config.lookupError };
            const quote = runtime.config.quote || BASE_QUOTE;
            const matches = quote.id === state.filters.id && quote.user_id === state.filters.user_id;
            return { data: matches ? { ...quote } : null, error: null };
          }
          if (table === 'quotes' && state.op === 'update') {
            if (runtime.config.updateError) return { data: null, error: runtime.config.updateError };
            const quote = runtime.config.quote || BASE_QUOTE;
            const matches = quote.id === state.filters.id && quote.user_id === state.filters.user_id && (!state.filters.status || quote.status === state.filters.status);
            return { data: matches ? { ...quote, ...state.values } : null, error: null };
          }
          if (table === 'profiles') return { data: { plan: runtime.config.plan || 'free', name: OWNER.user_metadata.name, email: OWNER.email }, error: null };
          return { data: null, error: null };
        },
        then(resolve, reject) { return query.maybeSingle().then(resolve, reject); },
      };
      return query;
    },
  };
}

function request(body = {}) {
  return { headers: new Headers({ 'content-type': 'application/json' }), json: async () => body };
}

async function send(config = {}, body = {}) {
  resetRuntime(config);
  const route = loadRoute({
    createServiceSupabaseClient: () => config.serviceClientMissing ? null : makeDb(),
    getRequestUser: async () => config.context || ({ mode: 'supabase', user: OWNER, supabase: {} }),
  });
  const response = await route.POST(request(body), { params: Promise.resolve({ id: config.id || BASE_QUOTE.id }) });
  return { response, body: await response.json() };
}

const first = await send({ plan: 'free' });
assert.equal(first.response.status, 200, 'Free draft send succeeds after delivery');
assert.equal(runtime.mail.length, 1);
assert.equal(runtime.mail[0].to, BASE_QUOTE.client_email, 'persisted client_email is recipient authority');
assert.equal(runtime.mail[0].portalUrl, null, 'Free email has no Portal link');
assert.equal(runtime.updates[0].values.status, 'sent');
assert.equal(runtime.audits[0].action, 'quote_status_changed');
assert.equal(runtime.growth[0].eventName, 'quote_sent');
assert.equal(runtime.analytics[0].eventName, 'Quote Sent');

for (const plan of ['starter', 'pro']) {
  const result = await send({ plan });
  assert.equal(result.response.status, 200, `${plan} delivery succeeds`);
  assert.equal(runtime.mail.length, 1);
  assert.equal(runtime.mail[0].portalUrl, plan === 'pro' ? 'https://corvioz.example/portal/secure-portal-token' : null);
}

for (const email of ['', 'not-an-email']) {
  const result = await send({ quote: { ...BASE_QUOTE, client_email: email } });
  assert.equal(result.response.status, 400);
  assert.equal(result.body.code, 'QUOTE_RECIPIENT_EMAIL_REQUIRED');
  assert.equal(runtime.mail.length, 0);
  assert.equal(runtime.updates.length, 0);
}

for (const status of ['approved', 'declined', 'converted', 'sent']) {
  const result = await send({ quote: { ...BASE_QUOTE, status } });
  assert.equal(result.response.status, 409, `${status} is not eligible for first Send`);
  assert.equal(runtime.mail.length, 0);
  assert.equal(runtime.updates.length, 0);
}

for (const config of [{ mailResult: { success: false, error: 'provider down' } }]) {
  const result = await send(config);
  assert.equal(result.response.status, 502);
  assert.equal(runtime.updates.length, 0, 'delivery failure leaves draft unchanged');
  assert.equal(runtime.audits.length, 0);
  assert.equal(runtime.analytics.length, 0);
}

{
  const result = await send({ serviceClientMissing: true });
  assert.equal(result.response.status, 503, 'unavailable database service fails closed before delivery');
  assert.equal(runtime.mail.length, 0);
}

{
  const result = await send({ quote: { ...BASE_QUOTE, user_id: 'owner-2' } });
  assert.equal(result.response.status, 404, 'foreign Quote is indistinguishable from missing');
  assert.equal(runtime.mail.length, 0);
}

{
  const result = await send({ updateError: { message: 'database unavailable' } });
  assert.equal(result.response.status, 500);
  assert.equal(result.body.code, 'DELIVERY_SUCCEEDED_STATUS_UPDATE_FAILED');
  assert.equal(runtime.mail.length, 1);
  assert.equal(runtime.audits.length, 0);
}

{
  const result = await send({ plan: 'pro' });
  assert.equal(result.response.status, 200);
  assert.deepEqual(runtime.portalTokens[0], {
    ownerId: OWNER.id,
    resourceType: 'quote',
    resourceId: BASE_QUOTE.id,
  });
  assert.equal(runtime.mail[0].replyTo, OWNER.email);
}

const emailSource = fs.readFileSync(path.join(root, 'src/app/lib/email.js'), 'utf8');
assert.match(emailSource, /getQuoteSentEmailHtml/);
assert.match(emailSource, /reply_to|replyTo/);
assert.equal(emailSource.includes('Client & Co <script>'), false);
const emailCode = ts.transpileModule(emailSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
delete process.env.RESEND_API_KEY;
const emailExports = {};
const emailModule = { exports: emailExports };
new Function('exports', 'require', 'module', '__filename', '__dirname', emailCode)(
  emailExports,
  (specifier) => specifier === './config' ? { getSiteUrl: () => 'https://corvioz.example' } : { Resend: class {} },
  emailModule,
  path.join(root, 'src/app/lib/email.js'),
  path.join(root, 'src/app/lib'),
);
const { getQuoteSentEmailHtml } = emailModule.exports;
const renderedEmail = getQuoteSentEmailHtml(BASE_QUOTE, 'https://corvioz.example/portal/token', 'A <Photographer>');
assert.match(renderedEmail, /Client &amp; Co &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(renderedEmail, /Shoot &amp; edit &lt;b&gt;/);
assert.match(renderedEmail, /Terms &lt;img src=x onerror=alert\(1\)&gt;/);
assert.equal(renderedEmail.includes('<script>alert(1)</script>'), false);
assert.match(renderedEmail, /Review Quote/);
const unconfiguredMail = await emailModule.exports.sendQuoteSentEmail(
  BASE_QUOTE.client_email,
  BASE_QUOTE,
  null,
  'Photographer',
  OWNER.email,
);
assert.equal(unconfiguredMail.success, false, 'unconfigured email provider fails closed');

const dashboardSource = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
assert.match(dashboardSource, /\/api\/quotes\/\$\{[^}]+\}\/send/);
assert.equal(/body:\s*JSON\.stringify\(\{\s*id:[\s\S]{0,160}status:\s*['"]sent['"]/.test(dashboardSource), false);
assert.match(dashboardSource, /Send Quote/);
assert.match(dashboardSource, /Save Quote first/);

const quotesRouteSource = fs.readFileSync(path.join(root, 'src/app/api/quotes/route.js'), 'utf8');
assert.match(quotesRouteSource, /QUOTE_SEND_REQUIRED/);
assert.ok(quotesRouteSource.indexOf('if (status === "sent")') < quotesRouteSource.indexOf('.update({ status,'), 'generic status route guards direct sent writes before the database update');
assert.equal(quotesRouteSource.includes('Proposal Sent'), false, 'obsolete direct-send analytics wording is removed with the bypass');

console.log('R51.2 Quote Send delivery tests passed.');
