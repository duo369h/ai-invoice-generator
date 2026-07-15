import assert from 'node:assert/strict';
import { configureRouteRuntime, getRouteRuntimeCalls } from './test-support/route-runtime-mocks.mjs';
import { POST } from '../src/app/api/events/activation/claim/route.js';

const user = { id: 'user-1' };
const request = (event_name) => new Request('http://localhost/api/events/activation/claim', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_name }) });
const context = (mode = 'supabase') => ({ mode, user });

configureRouteRuntime({ context: context('unauthenticated') });
let response = await POST(request('first_quote_created'));
assert.equal(response.status, 401, 'unauthenticated claim is rejected');

configureRouteRuntime({ context: context() });
response = await POST(request('other'));
assert.equal(response.status, 400, 'invalid event is rejected');

for (const [eventName, documentType] of [['first_quote_created', 'quotes'], ['first_invoice_created', 'invoices']]) {
  configureRouteRuntime({ context: context(), existingDocuments: { [documentType]: false } });
  response = await POST(request(eventName));
  assert.equal(response.status, 409, `${documentType} claim without persistence is rejected`);
  assert.deepEqual(await response.json(), { claimed: false, error: `no_persisted_${documentType.slice(0, -1)}` });

  configureRouteRuntime({ context: context(), existingDocuments: { [documentType]: true }, helperClaimError: null });
  response = await POST(request(eventName));
  assert.equal(response.status, 200, `${documentType} first claim succeeds`);
  assert.deepEqual(await response.json(), { claimed: true });

  configureRouteRuntime({ context: context(), existingDocuments: { [documentType]: true }, helperClaimError: { code: '23505', message: 'duplicate' } });
  response = await POST(request(eventName));
  assert.equal(response.status, 200, `${documentType} duplicate is non-blocking`);
  assert.deepEqual(await response.json(), { claimed: false });

  configureRouteRuntime({ context: context(), existingDocuments: { [documentType]: true }, helperClaimError: { code: '42P01', message: 'missing table' } });
  response = await POST(request(eventName));
  assert.equal(response.status, 200, `${documentType} missing claim table is non-blocking`);
  assert.deepEqual(await response.json(), { claimed: false });
  assert.ok(getRouteRuntimeCalls().includes('helper_claim_insert'), `${documentType} delegates to the claim helper`);

  configureRouteRuntime({ context: context(), existingDocuments: { [documentType]: true }, helperClaimThrows: true });
  response = await POST(request(eventName));
  assert.equal(response.status, 200, `${documentType} claim service exception is non-blocking`);
  assert.deepEqual(await response.json(), { claimed: false });
}

console.log('GA4 activation claim endpoint runtime tests passed.');
