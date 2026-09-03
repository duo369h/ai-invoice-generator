import assert from 'node:assert/strict';
import {
  createQuoteWithAtomicQuota,
  createInvoiceWithAtomicQuota,
} from '../src/app/lib/supabase.js';

const row = (kind) => ({
  id: `${kind}-boundary-5`,
  user_id: 'user-boundary',
  [`${kind}_number`]: `R1-${kind}-5`,
});

const contradictoryRpc = (kind) => ({
  rpc: async () => ({
    data: row(kind),
    error: { message: 'QUOTA_EXCEEDED: allowance reached after the row was created' },
  }),
});

const rejectionRpc = {
  rpc: async () => ({
    data: null,
    error: { message: 'QUOTA_EXCEEDED: allowance reached for cycle' },
  }),
};

async function expectQuotaError(promise) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, 'QUOTA_EXCEEDED');
    assert.equal(error.status, 403);
    return true;
  });
}

const quoteResult = await createQuoteWithAtomicQuota(
  contradictoryRpc('quote'),
  'user-boundary',
  'free',
  {}
);
assert.equal(quoteResult.data.id, 'quote-boundary-5');

const invoiceResult = await createInvoiceWithAtomicQuota(
  contradictoryRpc('invoice'),
  'user-boundary',
  'free',
  {}
);
assert.equal(invoiceResult.data.id, 'invoice-boundary-5');

await expectQuotaError(createQuoteWithAtomicQuota(rejectionRpc, 'user-boundary', 'free', {}));
await expectQuotaError(createInvoiceWithAtomicQuota(rejectionRpc, 'user-boundary', 'free', {}));

function boundaryFixture(plan, quoteCount, invoiceCount) {
  const state = {
    quotes: Array.from({ length: quoteCount }, (_, index) => ({ id: `seed-q-${index}` })),
    invoices: Array.from({ length: invoiceCount }, (_, index) => ({ id: `seed-i-${index}` })),
  };
  const limit = plan === 'starter' ? 30 : plan === 'pro' ? Infinity : 5;
  return {
    state,
    client: {
      rpc: async (name) => {
        if (state.quotes.length + state.invoices.length >= limit) {
          return { data: null, error: { message: 'QUOTA_EXCEEDED: allowance reached for cycle' } };
        }
        if (name === 'check_and_create_quote') {
          const created = { id: `created-q-${state.quotes.length}`, user_id: 'user-boundary' };
          state.quotes.push(created);
          return { data: created, error: null };
        }
        const created = { id: `created-i-${state.invoices.length}`, user_id: 'user-boundary' };
        state.invoices.push(created);
        return { data: created, error: null };
      },
    },
  };
}

async function runPermutation(plan, firstKind) {
  const startCount = plan === 'starter' ? 29 : 4;
  const fixture = boundaryFixture(plan, Math.floor(startCount / 2), Math.ceil(startCount / 2));
  const createFirst = firstKind === 'quote' ? createQuoteWithAtomicQuota : createInvoiceWithAtomicQuota;
  const createSecond = firstKind === 'quote' ? createInvoiceWithAtomicQuota : createQuoteWithAtomicQuota;
  const created = await createFirst(fixture.client, 'user-boundary', plan, {});
  assert.ok(created.data.id, `${plan} ${firstKind} boundary document must be created`);
  assert.equal(fixture.state.quotes.length + fixture.state.invoices.length, startCount + 1);
  await expectQuotaError(createSecond(fixture.client, 'user-boundary', plan, {}));
  const countAfterReject = fixture.state.quotes.length + fixture.state.invoices.length;
  assert.equal(countAfterReject, startCount + 1);
  await expectQuotaError(createSecond(fixture.client, 'user-boundary', plan, {}));
  assert.equal(fixture.state.quotes.length + fixture.state.invoices.length, countAfterReject);
}

await runPermutation('free', 'quote');
await runPermutation('free', 'invoice');
await runPermutation('starter', 'quote');
await runPermutation('starter', 'invoice');

const proFixture = boundaryFixture('pro', 100, 100);
await createQuoteWithAtomicQuota(proFixture.client, 'user-boundary', 'pro', {});
await createInvoiceWithAtomicQuota(proFixture.client, 'user-boundary', 'pro', {});
assert.equal(proFixture.state.quotes.length + proFixture.state.invoices.length, 202);

console.log('COMBINED_QUOTA_BOUNDARY_HELPER_TEST=PASS');
