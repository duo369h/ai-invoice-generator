import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeAuditLogs,
  getRouteRuntimeCalls,
  getRouteRuntimeInserts,
  getRouteRuntimeRpcCalls,
  getRouteRuntimeUpdates,
} from './test-support/route-runtime-mocks.mjs';

const validationSource = await readFile(new URL('../src/app/lib/validation.js', import.meta.url), 'utf8');
assert.match(
  validationSource,
  /id:\s*obj\.id\s*\?\s*id\(obj\.id,\s*'id'\)\s*:\s*''/,
  'Invoice payload validation preserves a validated document id',
);

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const invoiceRoute = await import('../src/app/api/invoices/route.js');

const user = { id: 'user-1', email: 'owner@example.com' };
const context = () => ({ mode: 'supabase', user });
const baseInvoice = {
  id: 'invoice-1',
  user_id: user.id,
  invoice_number: 'INV-OLD',
  client_name: 'Old client',
  status: 'pending',
  payment_status: 'unpaid',
  total: 10000,
  amount_paid_cents: 0,
  amount_due_cents: 10000,
  due_date: '2026-12-31',
};
const basePayload = {
  client_name: 'Updated client',
  client_email: 'updated@example.com',
  client_address: 'Updated address',
  business_name: 'Updated business',
  business_email: 'business@example.com',
  business_address: 'Business address',
  logo_url: 'https://example.com/logo.png',
  currency: 'usd',
  items: [{ description: 'Updated work', quantity: 2, unitPrice: 75 }],
  discount_rate: 10,
  tax_rate: 5,
  invoice_number: 'INV-UPDATED',
  payment_terms: 'Net 14',
  notes: 'Updated notes',
  invoice_date: '2026-07-27',
  due_date: '2026-08-10',
  doc_type: 'invoice',
  client_id: 'client-1',
  quote_id: 'quote-1',
  payment_link: 'https://example.com/pay',
};

function postRequest(payload) {
  return new Request('http://localhost/api/invoices', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
    body: JSON.stringify(payload),
  });
}

async function runUpdate(invoice, payload = {}, config = {}) {
  configureRouteRuntime({
    operation: 'full-update',
    logRequestFlow: true,
    logDatabaseCalls: true,
    logSideEffects: true,
    context: context(),
    invoiceRecords: invoice ? [invoice] : [],
    clientRecords: [{ id: 'client-1', user_id: user.id }],
    quoteRecords: [{ id: 'quote-1', user_id: user.id }],
    persisted: { ...baseInvoice, id: 'invoice-duplicate' },
    ...config,
  });
  const response = await invoiceRoute.POST(postRequest({ id: 'invoice-1', ...basePayload, ...payload }));
  return {
    response,
    body: await response.json(),
    calls: getRouteRuntimeCalls(),
    inserts: getRouteRuntimeInserts(),
    updates: getRouteRuntimeUpdates(),
    audits: getRouteRuntimeAuditLogs(),
  };
}

{
  configureRouteRuntime({
    operation: 'create',
    logSideEffects: true,
    context: context(),
    entitlements: { invoice: true, client_portal: true },
    persisted: { ...baseInvoice, id: 'invoice-created', invoice_number: 'INV-CREATED' },
  });
  const response = await invoiceRoute.POST(postRequest(basePayload));
  const body = await response.json();
  assert.equal(response.status, 201, 'a request without id retains create HTTP 201');
  assert.equal(body.data.id, 'invoice-created');
  assert.equal(getRouteRuntimeInserts().length, 0, 'atomic create does not use a direct table insert');
  const createRpcCalls = getRouteRuntimeRpcCalls().filter(({ name }) => name === 'check_and_create_invoice');
  assert.equal(createRpcCalls.length, 1, 'create invokes the invoice atomic creation RPC exactly once');
  assert.equal(createRpcCalls[0].args.p_user_id, user.id, 'atomic create is scoped to the authenticated owner');
  assert.equal(createRpcCalls[0].args.p_invoice_payload.user_id, user.id, 'atomic create payload preserves the authenticated owner');
  assert.equal(getRouteRuntimeUpdates().length, 0, 'create performs no update');
  assert.ok(getRouteRuntimeCalls().includes('usage:invoice:increment'), 'create increments Invoice usage');
  assert.ok(getRouteRuntimeCalls().includes('portal-token:create'), 'create creates a portal token');
  assert.ok(getRouteRuntimeCalls().includes('metric:first_invoice_created_at'), 'create records the first-Invoice metric');
  assert.ok(getRouteRuntimeCalls().includes('audit:invoice_created'), 'create records invoice_created audit');
  assert.ok(getRouteRuntimeCalls().includes('analytics:Invoice Created'), 'create records Invoice Created analytics');
}

{
  const result = await runUpdate(baseInvoice, {
    user_id: 'attacker-user',
    status: 'paid',
    payment_status: 'paid',
    paid_at: '2026-07-27T00:00:00.000Z',
    amount_paid: 999,
    amount_paid_cents: 999,
    amount_due_cents: 0,
  });
  assert.equal(result.response.status, 200, 'an owned request with id performs full update with HTTP 200');
  assert.equal(result.body.data.id, baseInvoice.id, 'update returns the same Invoice id');
  assert.equal(result.body.data.status, baseInvoice.status, 'full update preserves legacy status');
  assert.equal(result.inserts.length, 0, 'update performs zero inserts');
  assert.equal(result.updates.length, 1, 'update executes exactly once');
  assert.equal([baseInvoice].length + result.inserts.length, 1, 'editing keeps the simulated Invoice record count at one');
  assert.equal(result.updates[0].kind, 'service', 'update uses the service-role client');
  assert.equal(result.updates[0].values.client_name, 'Updated client');
  for (const forbidden of [
    'id', 'user_id', 'created_at', 'status', 'payment_status', 'paid_at',
    'amount_paid', 'amount_paid_cents', 'amount_due_cents', 'payment_ledger',
  ]) {
    assert.equal(Object.hasOwn(result.updates[0].values, forbidden), false, `update cannot write ${forbidden}`);
  }
  assert.ok(result.calls.includes('eq:invoices:id:invoice-1'), 'update is scoped by Invoice id');
  assert.ok(result.calls.includes('eq:invoices:user_id:user-1'), 'update is scoped by authenticated owner id');
  assert.ok(result.calls.includes('eq:invoices:payment_status:unpaid'), 'update includes payment_status snapshot');
  assert.ok(result.calls.includes('eq:invoices:amount_paid_cents:0'), 'update includes amount_paid_cents snapshot');
  assert.equal(result.calls.includes('quota:invoice'), false, 'update bypasses create quota checks');
  assert.equal(result.calls.includes('usage:invoice:increment'), false, 'update does not increment usage');
  assert.equal(result.calls.includes('portal-token:create'), false, 'update does not create a portal token');
  assert.equal(result.calls.includes('metric:first_invoice_created_at'), false, 'update does not record first-Invoice metric');
  assert.equal(result.calls.includes('analytics:Invoice Created'), false, 'update does not record creation analytics');
  assert.equal(result.audits.length, 1);
  assert.equal(result.audits[0].action, 'invoice_updated');
}

{
  const result = await runUpdate(baseInvoice, {}, {
    quota: { invoicesAllowed: false },
    entitlements: { invoice: false },
  });
  assert.equal(result.response.status, 200, 'update is not blocked by create entitlement or quota');
  assert.equal(result.inserts.length, 0);
  assert.equal(result.updates.length, 1);
}

for (const [label, invoice] of [
  ['partial payment_status', { ...baseInvoice, payment_status: 'partial', amount_paid_cents: 4000 }],
  ['paid payment_status', { ...baseInvoice, payment_status: 'paid', amount_paid_cents: 10000 }],
  ['positive amount_paid_cents', { ...baseInvoice, payment_status: 'unpaid', amount_paid_cents: 1 }],
  ['legacy paid status', { ...baseInvoice, status: 'paid', payment_status: undefined, amount_paid_cents: undefined }],
]) {
  const result = await runUpdate(invoice);
  assert.equal(result.response.status, 409, `${label} blocks full update`);
  assert.equal(result.body.error, 'SETTLED_INVOICE_WRITE_CONFLICT');
  assert.equal(result.updates.length, 0, `${label} performs no update`);
}

{
  const missing = await runUpdate(null);
  const nonOwner = await runUpdate({ ...baseInvoice, user_id: 'user-2' });
  assert.equal(missing.response.status, 404, 'missing Invoice returns 404');
  assert.equal(nonOwner.response.status, 404, 'non-owner Invoice returns 404');
  assert.deepEqual(missing.body, nonOwner.body, 'missing and non-owner responses are indistinguishable');
}

{
  const result = await runUpdate(baseInvoice, {}, { serviceClientMissing: true });
  assert.equal(result.response.status, 503, 'missing service-role configuration fails closed');
  assert.equal(result.updates.length, 0);
  assert.equal(result.inserts.length, 0);
}

{
  const concurrentlyPaid = { ...baseInvoice, payment_status: 'partial', amount_paid_cents: 1 };
  const result = await runUpdate(baseInvoice, {}, { invoiceWriteRecords: [concurrentlyPaid] });
  assert.equal(result.response.status, 409, 'payment snapshot race returns 409');
  assert.equal(result.body.error, 'SETTLED_INVOICE_WRITE_CONFLICT');
}

{
  const expectedErrors = [];
  const originalConsoleError = console.error;
  console.error = (...args) => expectedErrors.push(args);
  let result;
  try {
    result = await runUpdate(baseInvoice, {}, { auditLogThrows: true });
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(result.response.status, 200, 'audit failure cannot turn completed update into failure');
  assert.equal(result.updates.length, 1, 'audit failure never retries update');
  assert.equal(expectedErrors.length, 1);
  assert.equal(expectedErrors[0][0], 'Failed to write invoice update audit log:');
}

console.log('Invoice full-update runtime tests passed.');
