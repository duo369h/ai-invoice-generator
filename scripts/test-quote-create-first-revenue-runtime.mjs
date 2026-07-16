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
const hasCall = (prefix) => getRouteRuntimeCalls().some((entry) => entry.startsWith(prefix));
const anchorLoop = (overrides = {}) => ({
  user_id: user.id,
  quote_id: 'anchor-quote',
  invoice_id: null,
  legacy_blocked_at: null,
  ...overrides,
});
const anchorQuote = (overrides = {}) => ({
  id: 'anchor-quote',
  user_id: user.id,
  status: 'draft',
  ...overrides,
});

function firstRevenueContext({ loop = null, quote = null, invoice = null, decision } = {}) {
  return {
    loop,
    quote,
    invoice,
    decision: decision || resolveFirstRevenueLoop({ plan: 'free', loop, quote, invoice }),
  };
}

function validClaimedContext() {
  return firstRevenueContext({ loop: anchorLoop(), quote: anchorQuote() });
}

async function assertBlockedFreeQuoteCreate(label, firstRevenueLoopContext) {
  configureRouteRuntime({
    context: context(),
    plan: 'free',
    firstRevenueLoopContext,
  });

  const blockedResponse = await quoteRoute.POST(request(`QT-${label}`));
  assert.equal(blockedResponse.status, 409, `${label} retains the stable first-revenue blocking response`);
  assert.deepEqual(await blockedResponse.json(), { error: 'FIRST_REVENUE_QUOTE_ALREADY_CLAIMED' });
  assert.equal(hasCall('persist:create_first_revenue_quote'), false, `${label} does not invoke the claim RPC`);
  assert.equal(hasCall('persist:quotes'), false, `${label} does not bypass the first-revenue state machine with an insert`);
  assert.equal(getRouteRuntimeUpdates().some((entry) => entry.table === 'first_revenue_loops'), false, `${label} does not update the first-revenue loop`);
  assert.equal(getRouteRuntimeAuditLogs().length, 0, `${label} does not write a success audit event`);
}

assert.equal(typeof quoteRoute.POST, 'function', 'Quote route exports a POST handler');

const cleanUnclaimed = firstRevenueContext();
assert.equal(cleanUnclaimed.decision.mode, 'allowance');
assert.equal(cleanUnclaimed.decision.canCreateQuote, true);
configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContext: cleanUnclaimed,
  persisted: { id: 'anchor-quote', user_id: user.id, quote_number: 'QT-1', status: 'draft' },
});
let response = await quoteRoute.POST(request('QT-1'));
assert.equal(response.status, 201, 'a clean first Free Quote is created through the first-revenue RPC');
assert.equal((await response.json()).id, 'anchor-quote');
assert.equal(hasCall('persist:create_first_revenue_quote'), true, 'the clean first Free Quote calls the claim RPC');
assert.equal(hasCall('persist:quotes'), false, 'the clean first Free Quote does not use a direct table insert');
assert.equal(getRouteRuntimeRpcCalls()[0].args.p_user_id, user.id, 'the RPC receives the authenticated owner ID');

const claimedLoop = validClaimedContext();
assert.equal(claimedLoop.decision.mode, 'allowance');
assert.equal(claimedLoop.decision.canCreateQuote, false);
configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContext: claimedLoop,
  persisted: { id: 'quote-2', user_id: user.id, quote_number: 'QT-2', status: 'draft' },
});
response = await quoteRoute.POST(request('QT-2'));
assert.equal(response.status, 201, 'a second Free Quote remains creatable after a valid first-revenue claim');
assert.equal((await response.json()).id, 'quote-2');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'a valid claimed user does not re-enter the first-revenue RPC');
assert.equal(hasCall('persist:quotes'), true, 'a valid claimed user uses the normal Quote insert path');
assert.equal(getRouteRuntimeInserts()[0].values.user_id, user.id, 'the normal insert ignores attacker-controlled user_id input');
assert.equal(getRouteRuntimeUpdates().some((entry) => entry.table === 'first_revenue_loops'), false, 'a later Quote never updates the claimed first-revenue loop');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContext: validClaimedContext(),
  persisted: { id: 'quote-3', user_id: user.id, quote_number: 'QT-3', status: 'draft' },
});
response = await quoteRoute.POST(request('QT-3'));
assert.equal(response.status, 201, 'third and later valid Free Quotes use the same normal insert path');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'later valid Quotes never re-claim first revenue');
assert.equal(hasCall('persist:quotes'), true, 'later valid Quotes use a normal insert');

const missingAnchorQuote = firstRevenueContext({ loop: anchorLoop(), quote: null });
assert.equal(missingAnchorQuote.decision.canCreateQuote, true, 'the production resolver treats a missing anchor Quote as recoverable');
await assertBlockedFreeQuoteCreate('MISSING-ANCHOR-QUOTE', missingAnchorQuote);

const mismatchedAnchorQuote = firstRevenueContext({ loop: anchorLoop(), quote: anchorQuote({ id: 'different-quote' }) });
assert.equal(mismatchedAnchorQuote.decision.canCreateQuote, true, 'the production resolver treats an ID mismatch as recoverable');
await assertBlockedFreeQuoteCreate('MISMATCHED-ANCHOR-QUOTE', mismatchedAnchorQuote);

const unexpectedQuoteWithoutAnchor = firstRevenueContext({
  loop: anchorLoop({ quote_id: null }),
  quote: anchorQuote(),
});
await assertBlockedFreeQuoteCreate('UNEXPECTED-QUOTE-WITHOUT-ANCHOR', unexpectedQuoteWithoutAnchor);

const unexpectedInvoiceWithoutAnchor = firstRevenueContext({
  loop: anchorLoop({ quote_id: null }),
  invoice: { id: 'unexpected-invoice', user_id: user.id, payment_link: '' },
});
await assertBlockedFreeQuoteCreate('UNEXPECTED-INVOICE-WITHOUT-ANCHOR', unexpectedInvoiceWithoutAnchor);

const missingInvoiceWithoutAnchor = firstRevenueContext({
  loop: anchorLoop({ quote_id: null, invoice_id: 'missing-invoice' }),
  invoice: null,
});
assert.equal(missingInvoiceWithoutAnchor.decision.canCreateQuote, true, 'the production resolver reaches allowance before it evaluates a dangling Invoice reference');
await assertBlockedFreeQuoteCreate('MISSING-INVOICE-WITHOUT-ANCHOR', missingInvoiceWithoutAnchor);

const legacyBlocked = firstRevenueContext({
  loop: anchorLoop({ legacy_blocked_at: '2026-01-01T00:00:00.000Z' }),
  quote: anchorQuote(),
});
assert.equal(legacyBlocked.decision.mode, 'blocked', 'the production resolver blocks an otherwise valid anchor when it is legacy-blocked');
await assertBlockedFreeQuoteCreate('LEGACY-BLOCKED', legacyBlocked);

const missingInvoice = firstRevenueContext({
  loop: anchorLoop({ invoice_id: 'missing-invoice' }),
  quote: anchorQuote(),
  invoice: null,
});
assert.equal(missingInvoice.decision.mode, 'blocked');
await assertBlockedFreeQuoteCreate('MISSING-INVOICE', missingInvoice);

const abnormalAnchorQuote = firstRevenueContext({
  loop: anchorLoop(),
  quote: anchorQuote({ status: 'converted' }),
});
assert.equal(abnormalAnchorQuote.decision.mode, 'blocked');
await assertBlockedFreeQuoteCreate('ABNORMAL-ANCHOR-QUOTE', abnormalAnchorQuote);

const nullCanCreateQuote = firstRevenueContext({
  decision: { ...cleanUnclaimed.decision, canCreateQuote: null },
});
await assertBlockedFreeQuoteCreate('NULL-CAN-CREATE-QUOTE', nullCanCreateQuote);

const missingCanCreateQuoteDecision = { ...cleanUnclaimed.decision };
delete missingCanCreateQuoteDecision.canCreateQuote;
await assertBlockedFreeQuoteCreate('MISSING-CAN-CREATE-QUOTE', firstRevenueContext({ decision: missingCanCreateQuoteDecision }));

const missingModeDecision = { ...cleanUnclaimed.decision };
delete missingModeDecision.mode;
await assertBlockedFreeQuoteCreate('MISSING-MODE', firstRevenueContext({ decision: missingModeDecision }));

await assertBlockedFreeQuoteCreate('BLOCKED-MODE', firstRevenueContext({
  decision: { ...cleanUnclaimed.decision, mode: 'blocked' },
}));

configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContext: cleanUnclaimed,
  persistenceError: { message: 'first_revenue_quote_already_claimed' },
});
response = await quoteRoute.POST(request('QT-RACE'));
assert.equal(response.status, 409, 'a concurrent first-revenue claim conflict remains a stable conflict');
assert.deepEqual(await response.json(), { error: 'FIRST_REVENUE_QUOTE_ALREADY_CLAIMED' });
assert.equal(hasCall('persist:create_first_revenue_quote'), true, 'the conflict comes from the claim RPC');
assert.equal(hasCall('persist:quotes'), false, 'a claim conflict never falls back to a normal insert');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContext: validClaimedContext(),
  persistenceError: { message: 'sensitive database constraint detail' },
});
const originalConsoleError = console.error;
console.error = () => {};
try {
  response = await quoteRoute.POST(request('QT-ERROR'));
} finally {
  console.error = originalConsoleError;
}
assert.equal(response.status, 500, 'ordinary normal-insert failures retain the route\'s stable 500 response');
assert.deepEqual(await response.json(), { error: 'Failed to create quote' });
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'normal insert errors do not invoke the claim RPC');

configureRouteRuntime({
  context: context(),
  plan: 'free',
  firstRevenueLoopContextError: new Error('sensitive first-revenue query detail'),
});
console.error = () => {};
try {
  response = await quoteRoute.POST(request('QT-CONTEXT-ERROR'));
} finally {
  console.error = originalConsoleError;
}
assert.equal(response.status, 500, 'first-revenue context failures remain stable server errors');
assert.deepEqual(await response.json(), { error: 'Failed to create quote' });
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'context failures do not invoke the claim RPC');
assert.equal(hasCall('persist:quotes'), false, 'context failures do not perform a normal insert');

configureRouteRuntime({
  context: context(),
  plan: 'pro',
  persisted: { id: 'pro-quote', user_id: user.id, quote_number: 'QT-PRO', status: 'draft' },
});
response = await quoteRoute.POST(request('QT-PRO'));
assert.equal(response.status, 201, 'non-Free users retain the existing normal Quote insert behavior');
assert.equal(hasCall('persist:create_first_revenue_quote'), false, 'non-Free users never call the first-revenue RPC');
assert.equal(hasCall('persist:quotes'), true, 'non-Free users continue to use normal inserts');

console.log('Quote first-revenue create API runtime tests passed.');
