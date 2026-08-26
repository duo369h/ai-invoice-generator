import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeSource = fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8');
const resolverSource = routeSource.match(/function resolvePlanFromPriceId\(priceId\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(resolverSource, 'resolvePlanFromPriceId source must remain discoverable');

function resolverFor(env) {
  const factory = new Function('process', `const console = { error() {} }; ${resolverSource}; return resolvePlanFromPriceId;`);
  return factory({ env });
}

function resolve(priceId, env) {
  return resolverFor(env)(priceId);
}

assert.equal(
  resolve('pri_pro_monthly', { NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: 'pri_pro_monthly' }),
  'pro',
  'canonical-only Pro monthly key resolves to Pro'
);

assert.equal(
  resolve('pri_pro_monthly', { NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: 'pri_pro_monthly' }),
  'pro',
  'legacy-only Pro monthly key remains compatible'
);

assert.equal(
  resolve('pri_pro_monthly', {
    NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: 'pri_pro_monthly',
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: 'pri_pro_monthly',
  }),
  'pro',
  'matching canonical and legacy keys resolve to Pro'
);

assert.equal(
  resolve('pri_pro_monthly_canonical', {
    NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: 'pri_pro_monthly_canonical',
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: 'pri_pro_monthly_legacy',
  }),
  null,
  'conflicting canonical and legacy keys fail closed'
);

assert.equal(
  resolve('pri_unknown', {
    NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: 'pri_pro_monthly',
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: 'pri_pro_monthly',
  }),
  null,
  'unknown price ID fails closed'
);

assert.equal(
  resolve('pri_pro_yearly', { NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID: 'pri_pro_yearly' }),
  'pro',
  'Pro yearly mapping remains independent'
);

assert.equal(
  resolve('pri_starter_monthly', { NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID: 'pri_starter_monthly' }),
  'starter',
  'Starter monthly mapping remains unchanged'
);

assert.equal(
  resolve('pri_starter_yearly', { NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID: 'pri_starter_yearly' }),
  'starter',
  'Starter yearly mapping remains unchanged'
);

console.log('PADDLE_PRO_MONTHLY_ENV_KEY_ALIGNMENT_R1=PASS');
console.log('CANONICAL_ONLY=PASS');
console.log('LEGACY_ONLY=PASS');
console.log('MATCHING_BOTH=PASS');
console.log('CONFLICT_FAIL_CLOSED=PASS');
console.log('UNKNOWN_PRICE_FAIL_CLOSED=PASS');
console.log('STARTER_AND_PRO_YEARLY_REGRESSION=PASS');
