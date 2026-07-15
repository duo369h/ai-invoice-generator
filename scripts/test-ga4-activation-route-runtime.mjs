import assert from 'node:assert/strict';
import { configureRouteRuntime, getRouteRuntimeCalls } from './test-support/route-runtime-mocks.mjs';

const quoteRoute = await import('../src/app/api/quotes/route.js');
const invoiceRoute = await import('../src/app/api/invoices/route.js');

const user = { id: '11111111-1111-1111-1111-111111111111', email: 'test@example.com', user_metadata: { name: 'Test User' } };
const context = (mode = 'supabase') => ({ mode, user });

function request(url, body) {
  return new Request(url, body === undefined ? undefined : {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

function quotePayload() {
  return { client_name: 'Client', client_email: 'client@example.com', client_address: '', items: [{ description: 'Session', quantity: 1, unitPrice: 100 }], discount_rate: 0, tax_rate: 0, currency: 'USD', notes: '', status: 'draft' };
}

function invoicePayload() {
  return { client_name: 'Client', client_email: 'client@example.com', client_address: '', business_name: 'Test', business_email: '', business_address: '', logo_url: '', currency: 'USD', items: [{ description: 'Session', quantity: 1, unitPrice: 100 }], discount_rate: 0, tax_rate: 0, invoice_number: 'INV-1', payment_terms: 'Net 30', notes: '', invoice_date: '2026-07-15', due_date: null, doc_type: 'invoice', client_id: null, quote_id: null, payment_link: '' };
}

async function body(response) {
  return response.json();
}

async function testRoute(name, route, payload, eventName, listShape) {
  configureRouteRuntime({ operation: 'get', context: context(), list: [{ id: `${name}-list` }] });
  let response = await route.GET(request(`http://localhost/api/${name}`));
  assert.equal(response.status, 200, `${name} authenticated GET succeeds`);
  assert.deepEqual(await body(response), listShape, `${name} GET response shape is preserved`);
  assert.deepEqual(getRouteRuntimeCalls(), [], `${name} GET does not claim activation`);

  configureRouteRuntime({ operation: 'get', context: context('unauthenticated') });
  response = await route.GET(request(`http://localhost/api/${name}`));
  assert.equal(response.status, 401, `${name} unauthenticated GET remains unauthorized`);
  assert.deepEqual(getRouteRuntimeCalls(), [], `${name} unauthenticated GET does not claim activation`);

  const persisted = { id: `${name}-first`, [`${name === 'quotes' ? 'quote' : 'invoice'}_number`]: `${name}-1`, currency: 'USD', total: 10000 };
  configureRouteRuntime({ context: context(), persisted });
  response = await route.POST(request(`http://localhost/api/${name}`, payload()));
  let data = await body(response);
  assert.equal(response.status, 201, `${name} first POST succeeds`);
  assert.equal((name === 'quotes' ? data : data.data).id, persisted.id, `${name} returns persisted data`);
  assert.equal((name === 'quotes' ? data : data.data).activation_event, undefined, `${name} keeps activation out of product response`);
  assert.equal((name === 'quotes' ? data : data.data).activation_claimed, undefined, `${name} keeps claim state out of product response`);
  assert.deepEqual(getRouteRuntimeCalls(), [`persist:${name}`], `${name} persistence route never claims activation`);

  configureRouteRuntime({ context: context(), persisted: null, persistenceError: { message: 'database failed' } });
  response = await route.POST(request(`http://localhost/api/${name}`, payload()));
  assert.equal(response.status, 500, `${name} preserves the existing persistence failure response`);
  assert.deepEqual(getRouteRuntimeCalls(), [`persist:${name}`], `${name} does not claim after persistence failure`);
}

await testRoute('quotes', quoteRoute, quotePayload, 'first_quote_created', { data: [{ id: 'quotes-list' }] });
await testRoute('invoices', invoiceRoute, invoicePayload, 'first_invoice_created', { object: 'list', data: [{ id: 'invoices-list', mapped: true }], has_more: false, auth_mode: 'supabase' });

console.log('GA4 activation route runtime tests passed.');
