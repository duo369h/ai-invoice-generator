import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0;

function responseJson(body, init = {}) {
  return { status: init.status || 200, body, json: async () => body };
}

function request(body = {}, idempotencyKey = 'payment-key-1') {
  return {
    headers: new Headers({ 'content-type': 'application/json', 'idempotency-key': idempotencyKey }),
    json: async () => body,
  };
}

function invoiceQuery(invoice) {
  return {
    select: () => ({
      eq: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: invoice, error: null }) }),
      }),
    }),
  };
}

function loadPaymentRoute(overrides = {}) {
  const source = fs.readFileSync(path.join(root, 'src/app/api/invoices/[id]/payments/route.js'), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const invoice = overrides.invoice === undefined
    ? { id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'unpaid' }
    : overrides.invoice;
  const service = overrides.service || {
    from: () => invoiceQuery(invoice),
    rpc: async () => ({ data: { id: 'invoice-1', total: 10000, currency: 'USD', payment_status: 'partial' }, error: null }),
  };
  const supabase = {
    createServiceSupabaseClient: () => service,
    ensureProfile: overrides.ensureProfile || (async () => ({ plan: 'free' })),
    getRequestUser: overrides.getRequestUser || (async () => ({
      mode: 'supabase',
      user: { id: 'user-1', email: 'user@example.com' },
      supabase: {},
    })),
    mapSupabaseInvoice: (value) => value,
    recordServerGrowthEvent: overrides.recordServerGrowthEvent || (async () => {}),
    writeAuditLog: overrides.writeAuditLog || (async () => {}),
  };
  const customRequire = (id) => {
    if (id.includes('next/server')) return { NextResponse: { json: responseJson } };
    if (id.includes('lib/supabase')) return supabase;
    if (id.includes('lib/rate-limit')) return { rateLimitAuthenticated: async () => ({ success: true }) };
    if (id.includes('lib/security')) return { getIp: () => '127.0.0.1', requestContextResponse: () => null };
    if (id.includes('lib/validation')) return { validateObject: (value) => value, validationResponse: () => null };
    if (id.includes('product-analytics-server')) return { recordProductAnalyticsEvent: overrides.recordProductAnalyticsEvent || (async () => {}) };
    return {};
  };
  const module = { exports: {} };
  new Function('exports', 'require', 'module', '__filename', '__dirname', code)(
    module.exports,
    customRequire,
    module,
    path.join(root, 'src/app/api/invoices/[id]/payments/route.js'),
    path.join(root, 'src/app/api/invoices/[id]/payments')
  );
  return module.exports;
}

async function test(name, callback) {
  await callback();
  passed += 1;
  console.log(`PASS: ${name}`);
}

const paymentBody = { amount_cents: 10000, currency: 'USD' };
const routeParams = { params: Promise.resolve({ id: 'invoice-1' }) };

for (const [code, expectedStatus] of [
  ['invoice_payment_exceeds_amount_due', 409],
  ['invoice_payment_idempotency_key_reused', 409],
  ['invoice_payment_currency_mismatch', 409],
  ['invoice_not_found', 404],
  ['invoice_payment_amount_invalid', 400],
  ['invoice_payment_source_invalid', 400],
  ['invoice_payment_idempotency_key_invalid', 400],
]) {
  await test(`RPC ${code} maps to HTTP ${expectedStatus}`, async () => {
    const route = loadPaymentRoute({ service: {
      from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'unpaid' }),
      rpc: async () => ({ data: null, error: { message: code } }),
    } });
    const response = await route.POST(request(paymentBody), routeParams);
    assert.equal(response.status, expectedStatus);
    assert.equal((await response.json()).error, expectedStatus >= 500 ? 'Failed to record payment' : code);
  });
}

await test('unknown RPC failure is a generic HTTP 500', async () => {
  const route = loadPaymentRoute({ service: {
    from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'unpaid' }),
    rpc: async () => ({ data: null, error: { message: 'private postgres failure' } }),
  } });
  const response = await route.POST(request(paymentBody), routeParams);
  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, 'Failed to record payment');
});

await test('same-key retry on a fully paid invoice still calls RPC and succeeds', async () => {
  let calls = 0;
  const route = loadPaymentRoute({ service: {
    from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'paid' }),
    rpc: async () => {
      calls += 1;
      return { data: { id: 'invoice-1', total: 10000, currency: 'USD', payment_status: 'paid' }, error: null };
    },
  } });
  const response = await route.POST(request(paymentBody, 'same-key'), routeParams);
  assert.equal(response.status, 201);
  assert.equal(calls, 1);
});

await test('new key on a fully paid invoice reaches RPC and returns conflict', async () => {
  let calls = 0;
  const route = loadPaymentRoute({ service: {
    from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'paid' }),
    rpc: async () => {
      calls += 1;
      return { data: null, error: { message: 'invoice_payment_exceeds_amount_due' } };
    },
  } });
  const response = await route.POST(request(paymentBody, 'new-key'), routeParams);
  assert.equal(response.status, 409);
  assert.equal(calls, 1);
});

await test('successful RPC survives audit failure', async () => {
  const route = loadPaymentRoute({ writeAuditLog: async () => { throw new Error('audit unavailable'); } });
  const response = await route.POST(request(paymentBody), routeParams);
  assert.equal(response.status, 201);
});

await test('successful RPC survives analytics failure', async () => {
  const route = loadPaymentRoute({
    service: {
      from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'sent', payment_status: 'unpaid' }),
      rpc: async () => ({ data: { id: 'invoice-1', total: 10000, currency: 'USD', payment_status: 'paid' }, error: null }),
    },
    recordProductAnalyticsEvent: async () => { throw new Error('analytics unavailable'); },
  });
  const response = await route.POST(request(paymentBody), routeParams);
  assert.equal(response.status, 201);
});

await test('foreign invoice returns 404', async () => {
  const route = loadPaymentRoute({ invoice: null });
  const response = await route.POST(request(paymentBody), routeParams);
  assert.equal(response.status, 404);
});

await test('draft invoice is rejected before RPC', async () => {
  let calls = 0;
  const route = loadPaymentRoute({ service: {
    from: () => invoiceQuery({ id: 'invoice-1', currency: 'USD', status: 'draft', payment_status: 'unpaid' }),
    rpc: async () => { calls += 1; return { data: {}, error: null }; },
  } });
  const response = await route.POST(request(paymentBody), routeParams);
  assert.equal(response.status, 409);
  assert.equal(calls, 0);
});

console.log(`Payment API runtime checks: ${passed} passed.`);
