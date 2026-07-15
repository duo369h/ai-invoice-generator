import assert from 'node:assert/strict';
import { configureRouteRuntime } from './test-support/route-runtime-mocks.mjs';
import { claimFirstActivationEvent } from '../src/app/lib/product-analytics-server.js';

async function expectClaim(config, expected, message) {
  configureRouteRuntime(config);
  assert.deepEqual(await claimFirstActivationEvent({ eventName: 'first_quote_created', userId: 'user-1' }), expected, message);
}

await expectClaim({ helperClaimError: null }, { claimed: true }, 'first insert is granted');
await expectClaim({ helperClaimError: { code: '23505', message: 'duplicate' } }, { claimed: false }, 'duplicate claim is rejected');
await expectClaim({ helperClaimError: { code: '42P01', message: 'relation does not exist' } }, { claimed: false }, 'missing table is non-blocking');
await expectClaim({ helperClaimError: { code: 'XX000', message: 'database error' } }, { claimed: false }, 'ordinary error is non-blocking');
await expectClaim({ helperClaimThrows: true }, { claimed: false }, 'thrown insert is non-blocking');
await expectClaim({ serviceClientMissing: true }, { claimed: false }, 'missing service client is non-blocking');
configureRouteRuntime({});
assert.deepEqual(await claimFirstActivationEvent({ eventName: 'not_allowed', userId: 'user-1' }), { claimed: false }, 'invalid events are rejected');

console.log('GA4 activation claim helper runtime tests passed.');
