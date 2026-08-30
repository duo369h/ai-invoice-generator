import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeUpdates,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const invoiceRoute = await import('../src/app/api/invoices/route.js');

const user = { id: 'owner-1', email: 'owner@example.com' };
const context = { mode: 'supabase', user };
const existingInvoice = {
  id: 'invoice-1',
  user_id: user.id,
  client_id: 'client-owned',
  quote_id: 'quote-owned',
  status: 'pending',
  payment_status: 'unpaid',
  total: 10000,
  amount_paid_cents: 0,
  amount_due_cents: 10000,
};
const dashboardEditPayload = {
  client_name: 'Renamed only in snapshot',
  client_email: 'snapshot@example.com',
  client_address: 'Snapshot address',
  business_name: 'Business',
  business_email: 'business@example.com',
  business_address: 'Business address',
  logo_url: '',
  currency: 'USD',
  items: [{ description: 'Updated work', quantity: 1, unitPrice: 100 }],
  discount_rate: 0,
  tax_rate: 0,
  invoice_number: 'INV-1',
  payment_terms: 'Net 30',
  notes: 'Updated notes',
  invoice_date: '2026-08-30',
  due_date: '2026-09-30',
  doc_type: 'invoice',
  payment_link: '',
};

function request(payload) {
  return new Request('http://localhost/api/invoices', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: existingInvoice.id, ...payload }),
  });
}

async function run(payload = {}, relationConfig = {}, invoice = existingInvoice) {
  configureRouteRuntime({
    operation: 'full-update',
    context,
    invoiceRecords: [invoice],
    logDatabaseCalls: true,
    ...relationConfig,
  });
  const response = await invoiceRoute.POST(request({ ...dashboardEditPayload, ...payload }));
  return { response, body: await response.json(), updates: getRouteRuntimeUpdates() };
}

{
  const result = await run();
  assert.equal(result.response.status, 200, 'ordinary Dashboard Invoice edit remains successful');
  assert.equal(result.updates.length, 1);
  assert.equal(result.updates[0].values.client_id, existingInvoice.client_id, 'omitted client_id preserves the stored relation');
  assert.equal(result.updates[0].values.quote_id, existingInvoice.quote_id, 'omitted quote_id preserves the stored relation');
}

{
  const legacyInvoice = { ...existingInvoice, client_id: null, quote_id: null };
  const result = await run({}, {
    clientRecords: [{ id: 'client-owned', user_id: user.id }],
    quoteRecords: [{ id: 'quote-owned', user_id: user.id }],
  }, legacyInvoice);
  assert.equal(result.response.status, 200);
  assert.equal(result.updates[0].values.client_id, null, 'snapshot client name/email cannot create a canonical Client relation');
  assert.equal(result.updates[0].values.quote_id, null, 'snapshot fields cannot create a canonical Quote relation');
}

{
  const result = await run({ client_id: null, quote_id: null });
  assert.equal(result.response.status, 200, 'explicit null relation values retain the existing API contract');
  assert.equal(result.updates[0].values.client_id, null);
  assert.equal(result.updates[0].values.quote_id, null);
}

{
  const result = await run({ client_id: 'client-owned' }, {
    clientRecords: [{ id: 'client-owned', user_id: user.id }],
  });
  assert.equal(result.response.status, 200, 'an explicitly supplied owned client_id is accepted');
  assert.equal(result.updates.length, 1);
}

{
  const result = await run({ client_id: 'client-foreign' }, {
    clientRecords: [{ id: 'client-foreign', user_id: 'other-user' }],
  });
  assert.equal(result.response.status, 403, 'an explicitly supplied foreign client_id is rejected');
  assert.equal(result.body.code, 'CLIENT_NOT_OWNED');
  assert.equal(result.updates.length, 0, 'foreign client validation happens before Invoice UPDATE');
}

{
  const result = await run({ quote_id: 'quote-owned' }, {
    quoteRecords: [{ id: 'quote-owned', user_id: user.id }],
  });
  assert.equal(result.response.status, 200, 'an explicitly supplied owned quote_id is accepted');
  assert.equal(result.updates.length, 1);
}

{
  const result = await run({ quote_id: 'quote-foreign' }, {
    quoteRecords: [{ id: 'quote-foreign', user_id: 'other-user' }],
  });
  assert.equal(result.response.status, 403, 'an explicitly supplied foreign quote_id is rejected');
  assert.equal(result.body.code, 'QUOTE_NOT_OWNED');
  assert.equal(result.updates.length, 0, 'foreign quote validation happens before Invoice UPDATE');
}

{
  const result = await run({ client_id: 'client-foreign', client_name: 'Foreign snapshot', client_email: 'foreign@example.com' }, {
    clientRecords: [{ id: 'client-foreign', user_id: 'other-user' }],
  });
  assert.equal(result.response.status, 403, 'snapshot fields cannot bypass client ownership validation');
  assert.equal(result.updates.length, 0);
}

console.log('INVOICE_RELATION_PRESERVATION_OWNERSHIP_R45_TEST=PASS');
