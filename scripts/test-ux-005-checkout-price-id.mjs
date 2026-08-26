import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkoutPage = fs.readFileSync(path.join(root, 'src/app/checkout/page.js'), 'utf8');

assert.match(
  checkoutPage,
  /const billingPeriod = searchParams\.get\('billingPeriod'\) === 'yearly' \? 'yearly' : 'monthly';/,
  'Checkout must accept only monthly/yearly billing periods and default safely to monthly.',
);

assert.match(
  checkoutPage,
  /getPricingViewModel\(\{[\s\S]*?plans,[\s\S]*?billingPeriod,[\s\S]*?\}\)/,
  'Checkout must resolve pricing through the shared pricing view model.',
);

assert.match(
  checkoutPage,
  /const selectedCard = pricingViewModel\.cards\.find\(\(card\) => card\.id === planId\);[\s\S]*?const priceId = selectedCard\?\.priceMeta\?\.priceId;/,
  'Checkout must use the yearly or monthly Paddle price ID returned by the shared view model.',
);

assert.match(
  checkoutPage,
  /handleUpgradeCheckout\(\{[\s\S]*?planId,[\s\S]*?priceId,[\s\S]*?session,[\s\S]*?searchParams,[\s\S]*?setCheckoutLoading:/,
  'Checkout must pass the resolved priceId to the existing Paddle controller.',
);

assert.doesNotMatch(
  checkoutPage,
  /(?:fetch\(|router\.push\(|window\.location\.)[^\n]*(?:\/api\/webhooks\/paddle|\/api\/user\/entitlements)/,
  'Checkout must not bypass the webhook by updating plan state client-side.',
);

console.log('UX-005 checkout price-id regression check passed.');
