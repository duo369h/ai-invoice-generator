import assert from 'node:assert/strict';
import { register } from 'node:module';
import { resolveFirstRevenueLoop } from '../src/core/revenue/firstRevenueLoop.js';
import {
  configureRouteRuntime,
  getRouteRuntimeAuditLogs,
  getRouteRuntimeCalls,
  getRouteRuntimeInserts,
  getRouteRuntimeRpcCalls,
  getRouteRuntimeUpdates,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const quoteRoute = await import('../src/app/api/quotes/route.js');

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  user_metadata: { name: 'Owner' },
};
const context = () => ({ mode: 'supabase', user });
const anchorQuote = {
  id: 'quote-anchor',
  user_id: user.id,
  quote_number: 'QT-ANCHOR',
  client_name: 'Anchor client',
  status: 'sent',
};
const secondQuote = {
  id: 'quote-second',
  user_id: user.id,
  quote_number: 'QT-SECOND',
  client_name: 'Second client',
  status: 'draft',
};
const validClaimedContext = {
  loop: {
    user_id: user.id,
    quote_id: anchorQuote.id,
    invoice_id: null,
    legacy_blocked_at: null,
  },
  quote: anchorQuote,
  invoice: null,
};
validClaimedContext.decision = resolveFirstRevenueLoop({
  plan: 'free',
  ...validClaimedContext,
});

const basePayload = {
  quote_number: 'QT-UPDATED',
  client_name: 'Updated client',
  client_email: 'updated@example.com',
  client_address: 'Updated address',
  items: [{ description: 'Updated photography', quantity: 2, unitPrice: 750 }],
  discount_rate: 10,
  tax_rate: 5,
  currency: 'USD',
  notes: 'Updated notes',
  status: 'approved',
};

function postRequest(payload) {
  return new Request('http://localhost/api/quotes', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.20',
    },
    body: JSON.stringify(payload),
  });
}

async function runUpdate(quote, payload = {}, config = {}) {
  configureRouteRuntime({
    operation: 'quote-update',
    logRequestFlow: true,
    logDatabaseCalls: true,
    logSideEffects: true,
    context: context(),
    plan: 'free',
    firstRevenueLoopContext: validClaimedContext,
    quoteRecords: quote ? [quote] : [],
    persisted: { ...secondQuote, id: 'quote-duplicate' },
    ...config,
  });
  const requestedId = payload.id || quote?.id || secondQuote.id;
  const response = await quoteRoute.POST(postRequest({
    id: requestedId,
    ...basePayload,
    ...payload,
  }));
  return {
    response,
    body: await response.json(),
    calls: getRouteRuntimeCalls(),
    inserts: getRouteRuntimeInserts(),
    rpcs: getRouteRuntimeRpcCalls(),
    updates: getRouteRuntimeUpdates(),
    audits: getRouteRuntimeAuditLogs(),
  };
}

function assertUpdateHasNoCreateSideEffects(result, label) {
  assert.equal(result.inserts.length, 0, `${label}: insert count`);
  assert.equal(result.rpcs.length, 0, `${label}: First Revenue RPC count`);
  assert.equal(result.calls.includes('portal-token:create'), false, `${label}: portal token count`);
  assert.equal(result.calls.includes('analytics:Proposal Created'), false, `${label}: create analytics count`);
  assert.equal(result.calls.includes('first-revenue:context'), false, `${label}: First Revenue context count`);
  assert.equal(result.calls.includes('first-revenue:transition'), false, `${label}: transition guard count`);
}

{
  const result = await runUpdate(secondQuote);
  assert.equal(result.response.status, 200, 'a non-anchor Free Quote update returns HTTP 200');
  assert.equal(result.body.id, secondQuote.id, 'update returns the same Quote id');
  assert.equal(result.updates.length, 1, 'update executes exactly once');
  assert.equal([secondQuote].length + result.inserts.length, 1, 'editing keeps the simulated Quote count at one');
  assert.equal(result.updates[0].kind, 'service', 'update uses the service-role client');
  assert.deepEqual(result.updates[0].filters, {
    id: secondQuote.id,
    user_id: user.id,
  }, 'update is scoped by Quote id and authenticated owner id');
  assertUpdateHasNoCreateSideEffects(result, 'non-anchor Free Quote');
  assert.equal(result.audits.length, 1);
  assert.equal(result.audits[0].action, 'quote_updated');
}

{
  const result = await runUpdate(anchorQuote, {
    client_name: 'Anchor client updated',
    status: 'declined',
  });
  assert.equal(result.response.status, 200, 'the anchor Quote content can be updated');
  assert.equal(result.body.client_name, 'Anchor client updated');
  assert.equal(result.body.status, anchorQuote.status, 'anchor Quote status remains unchanged');
  assert.equal(result.updates[0].values.status, anchorQuote.status);
  assertUpdateHasNoCreateSideEffects(result, 'anchor Free Quote');
}

{
  const result = await runUpdate(secondQuote, { status: 'converted' });
  assert.equal(result.response.status, 200, 'payload status cannot turn POST into a transition');
  assert.equal(result.body.status, secondQuote.status, 'database status wins over payload status');
  assert.equal(result.updates[0].values.status, secondQuote.status);
  assertUpdateHasNoCreateSideEffects(result, 'status-preserving update');
}

for (const plan of ['starter', 'pro']) {
  const result = await runUpdate(secondQuote, {}, { plan });
  assert.equal(result.response.status, 200, `${plan} Quote update returns HTTP 200`);
  assert.equal(result.updates.length, 1);
  assert.deepEqual(result.updates[0].filters, {
    id: secondQuote.id,
    user_id: user.id,
  });
  assertUpdateHasNoCreateSideEffects(result, `${plan} Quote`);
}

{
  const missing = await runUpdate(null);
  const nonOwner = await runUpdate({ ...secondQuote, user_id: 'user-2' });
  assert.equal(missing.response.status, 404, 'missing Quote returns 404');
  assert.equal(nonOwner.response.status, 404, 'non-owner Quote returns 404');
  assert.deepEqual(missing.body, { error: 'Quote not found' });
  assert.deepEqual(nonOwner.body, missing.body, 'missing and non-owner responses are indistinguishable');
  for (const [label, result] of [['missing', missing], ['non-owner', nonOwner]]) {
    assert.equal(result.updates.length, 0, `${label}: update count`);
    assert.equal(result.audits.length, 0, `${label}: audit count`);
    assertUpdateHasNoCreateSideEffects(result, label);
  }
}

for (const [label, config] of [
  ['lookup', { quoteLookupError: { message: 'private lookup details' } }],
  ['persistence', { quoteUpdateError: { message: 'private update details' } }],
]) {
  const result = await runUpdate(secondQuote, {}, config);
  assert.equal(result.response.status, 500, `${label} error returns HTTP 500`);
  assert.deepEqual(result.body, { error: 'Failed to update quote' });
  assert.equal(JSON.stringify(result.body).includes('private'), false, `${label} error is redacted`);
  assert.equal(result.audits.length, 0, `${label} error is not audited`);
  assertUpdateHasNoCreateSideEffects(result, `${label} error`);
}

{
  configureRouteRuntime({
    operation: 'quote-create',
    logSideEffects: true,
    context: context(),
    plan: 'free',
    firstRevenueLoopContext: validClaimedContext,
    persisted: {
      ...secondQuote,
      id: 'quote-created',
      quote_number: 'QT-CREATED',
    },
    portalToken: 'portal-created-token',
  });
  const response = await quoteRoute.POST(postRequest(basePayload));
  const body = await response.json();
  assert.equal(response.status, 201, 'a request without id retains create HTTP 201');
  assert.equal(body.id, 'quote-created');
  assert.equal(body.portal_token, 'portal-created-token', 'create retains portal token behavior');
  assert.equal(getRouteRuntimeInserts().length, 1, 'create inserts exactly once');
  assert.equal(getRouteRuntimeUpdates().length, 0, 'create performs no update');
  assert.equal(getRouteRuntimeRpcCalls().length, 0, 'a valid claimed Free user does not re-run the claim RPC');
  assert.ok(getRouteRuntimeCalls().includes('first-revenue:context'), 'Free create still evaluates First Revenue context');
  assert.ok(getRouteRuntimeCalls().includes('portal-token:create'), 'create still creates a portal token');
  assert.ok(getRouteRuntimeCalls().includes('analytics:Proposal Created'), 'create still emits Proposal Created analytics');
  assert.deepEqual(getRouteRuntimeAuditLogs().map(({ action }) => action), ['quote_created']);
}

for (const [label, config, expectedStatus] of [
  ['authentication failure', { context: { mode: 'unauthenticated' } }, 401],
  ['rate limit', {
    context: context(),
    rateLimitResult: { success: false, status: 429, error: 'Too many requests' },
  }, 429],
]) {
  configureRouteRuntime({
    operation: 'quote-update',
    logRequestFlow: true,
    logDatabaseCalls: true,
    logSideEffects: true,
    quoteRecords: [secondQuote],
    ...config,
  });
  const response = await quoteRoute.POST(postRequest({ id: secondQuote.id, ...basePayload }));
  assert.equal(response.status, expectedStatus, `${label} retains its stable response`);
  assert.equal(getRouteRuntimeUpdates().length, 0, `${label} never reaches database update`);
}

console.log('Quote update API runtime tests passed.');
