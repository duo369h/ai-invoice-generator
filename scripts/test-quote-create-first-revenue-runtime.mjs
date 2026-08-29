import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeCalls,
  getRouteRuntimeInserts,
  getRouteRuntimeRpcCalls,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const quoteRoute = await import('../src/app/api/quotes/route.js');

const user = { id: 'authenticated-user', email: 'owner@example.com', user_metadata: { name: 'Owner' } };
const context = () => ({ mode: 'supabase', user });
const payload = (quoteNumber) => ({
  quote_number: quoteNumber,
  client_name: 'Client',
  client_email: 'client@example.com',
  client_address: '',
  items: [{ description: 'Photography', quantity: 1, unitPrice: 1200 }],
  discount_rate: 0,
  tax_rate: 0,
  currency: 'USD',
  notes: '',
  status: 'draft',
  user_id: 'attacker-controlled-user',
});
const request = (quoteNumber) => new Request('http://localhost/api/quotes', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload(quoteNumber)),
});
const rpcNames = () => getRouteRuntimeRpcCalls().map(({ name }) => name);
const hasCall = (prefix) => getRouteRuntimeCalls().some((entry) => entry.startsWith(prefix));

assert.equal(typeof quoteRoute.POST, 'function', 'Quote route exports a POST handler');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  persisted: { id: 'anchor-quote', user_id: user.id, quote_number: 'QT-1', status: 'draft' },
});
let response = await quoteRoute.POST(request('QT-1'));
assert.equal(response.status, 201, 'a clean first Free Quote is created through the atomic create RPC');
assert.equal((await response.json()).id, 'anchor-quote');
assert.deepEqual(rpcNames(), [
  'check_and_create_quote',
  'claim_first_revenue_quote',
], 'the clean first Free Quote uses the authoritative create and tracking RPCs');
assert.equal(hasCall('persist:check_and_create_quote'), true, 'the clean first Free Quote uses the atomic create RPC');
assert.equal(hasCall('persist:claim_first_revenue_quote'), true, 'the clean first Free Quote invokes non-blocking first-revenue tracking');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'the obsolete first-revenue create RPC is not required');
assert.equal(getRouteRuntimeInserts().length, 0, 'the clean first Free Quote does not use a direct table insert');
assert.equal(getRouteRuntimeRpcCalls()[0].args.p_user_id, user.id, 'the create RPC receives the authenticated owner ID');
assert.equal(getRouteRuntimeRpcCalls()[1].args.p_user_id, user.id, 'the tracking RPC receives the authenticated owner ID');
assert.equal(getRouteRuntimeRpcCalls()[1].args.p_quote_id, 'anchor-quote', 'the tracking RPC receives the created Quote ID');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  persisted: { id: 'quote-2', user_id: user.id, quote_number: 'QT-2', status: 'draft' },
});
response = await quoteRoute.POST(request('QT-2'));
assert.equal(response.status, 201, 'a later Free Quote remains creatable through atomic creation');
assert.equal((await response.json()).id, 'quote-2');
assert.deepEqual(rpcNames(), [
  'check_and_create_quote',
  'claim_first_revenue_quote',
], 'later Free Quotes use the same authoritative create and tracking RPCs');
assert.equal(hasCall('persist:quotes'), false, 'later Free Quotes do not bypass atomic creation with a direct insert');
assert.equal(getRouteRuntimeRpcCalls()[0].args.p_user_id, user.id, 'later creation ignores attacker-controlled user_id input');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  persistenceError: { message: 'QUOTA_EXCEEDED' },
});
response = await quoteRoute.POST(request('QT-QUOTA'));
assert.equal(response.status, 403, 'atomic quota exhaustion remains forbidden');
assert.equal((await response.json()).code, 'QUOTA_EXCEEDED');
assert.deepEqual(rpcNames(), ['check_and_create_quote'], 'quota exhaustion stops before first-revenue tracking');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'quota enforcement does not require the obsolete RPC');
assert.equal(getRouteRuntimeInserts().length, 0, 'quota exhaustion never falls back to a direct insert');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  persistenceError: { message: 'sensitive database constraint detail' },
});
const originalConsoleError = console.error;
console.error = () => {};
try {
  response = await quoteRoute.POST(request('QT-ERROR'));
} finally {
  console.error = originalConsoleError;
}
assert.equal(response.status, 500, 'atomic creation failures retain a stable server error');
assert.equal((await response.json()).code, 'DATABASE_ERROR');
assert.deepEqual(rpcNames(), ['check_and_create_quote'], 'atomic creation failures stop before tracking');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'atomic creation failures do not require the obsolete RPC');

configureRouteRuntime({
  context: context(),
  plan: 'pro',
  persisted: { id: 'pro-quote', user_id: user.id, quote_number: 'QT-PRO', status: 'draft' },
});
response = await quoteRoute.POST(request('QT-PRO'));
assert.equal(response.status, 201, 'non-Free users retain successful atomic Quote creation');
assert.deepEqual(rpcNames(), ['check_and_create_quote'], 'non-Free users use the authoritative atomic create RPC');
assert.equal(hasCall('persist:claim_first_revenue_quote'), false, 'non-Free users do not invoke first-revenue tracking');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'non-Free users never call the obsolete RPC');
assert.equal(getRouteRuntimeInserts().length, 0, 'non-Free users do not use direct Quote inserts');

console.log('Quote first-revenue create API runtime tests passed.');
