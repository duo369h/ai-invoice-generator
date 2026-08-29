import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const pricingPage = read('src/app/pricing/page.js');
const pricingController = read('src/app/pricing/controller.ts');
const checkoutPage = read('src/app/checkout/page.js');

const authState = await import('../src/app/pricing/auth-state.mjs');
const {
  PRICING_AUTH_STATUS,
  resolvePricingAuthStatus,
  getPricingCheckoutAction,
  isPricingPaidCtaDisabled,
} = authState;

const session = { user: { id: 'user-1', email: 'user@example.com' } };
const effectsFor = (authStatus, currentSession, planId = 'starter') => {
  const effects = { signupRedirects: 0, savedIntents: 0, paddleOpens: 0 };
  const action = getPricingCheckoutAction({ planId, authStatus, session: currentSession });
  if (action === 'signup') {
    effects.signupRedirects += 1;
    effects.savedIntents += 1;
  }
  if (action === 'checkout') effects.paddleOpens += 1;
  return { action, effects };
};

function extractCheckoutObject(source) {
  const marker = 'Checkout.open({';
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, 'source must call Paddle.Checkout.open');
  const objectStart = start + marker.length - 1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = objectStart; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }
  throw new Error('unterminated Checkout.open object');
}

function hasTopLevelProperty(objectSource, propertyName) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let token = '';
  for (let index = 1; index < objectSource.length - 1; index += 1) {
    const character = objectSource[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{' || character === '[' || character === '(') {
      depth += 1;
      token = '';
      continue;
    }
    if (character === '}' || character === ']' || character === ')') {
      depth -= 1;
      token = '';
      continue;
    }
    if (depth === 0 && /[A-Za-z0-9_$]/.test(character)) {
      token += character;
      continue;
    }
    if (depth === 0 && character === ':') {
      if (token === propertyName) return true;
      token = '';
      continue;
    }
    if (depth === 0 && !/[ \n\r\t]/.test(character)) token = '';
  }
  return false;
}

assert.deepEqual(
  Object.values(PRICING_AUTH_STATUS).sort(),
  ['authenticated', 'error', 'loading', 'unauthenticated'],
  'pricing auth must distinguish loading, authenticated, unauthenticated, and error',
);
assert.equal(resolvePricingAuthStatus(null, { loading: true }), PRICING_AUTH_STATUS.LOADING);
assert.equal(resolvePricingAuthStatus(session), PRICING_AUTH_STATUS.AUTHENTICATED);
assert.equal(resolvePricingAuthStatus(null), PRICING_AUTH_STATUS.UNAUTHENTICATED);
assert.equal(resolvePricingAuthStatus(null, { error: true }), PRICING_AUTH_STATUS.ERROR);

const loadingClick = effectsFor(PRICING_AUTH_STATUS.LOADING, null);
const rapidLoadingClick = effectsFor(PRICING_AUTH_STATUS.LOADING, null);
assert.equal(loadingClick.action, 'wait');
assert.deepEqual(loadingClick.effects, { signupRedirects: 0, savedIntents: 0, paddleOpens: 0 });
assert.deepEqual(rapidLoadingClick, loadingClick, 'rapid clicks while auth is loading must be side-effect free');
assert.deepEqual(effectsFor(PRICING_AUTH_STATUS.ERROR, null).effects, {
  signupRedirects: 0,
  savedIntents: 0,
  paddleOpens: 0,
});
assert.deepEqual(effectsFor(PRICING_AUTH_STATUS.AUTHENTICATED, session, 'pro').effects, {
  signupRedirects: 0,
  savedIntents: 0,
  paddleOpens: 1,
});
assert.deepEqual(effectsFor(PRICING_AUTH_STATUS.UNAUTHENTICATED, null).effects, {
  signupRedirects: 1,
  savedIntents: 1,
  paddleOpens: 0,
});
assert.equal(getPricingCheckoutAction({ planId: 'free', authStatus: PRICING_AUTH_STATUS.LOADING, session: null }), 'free');
assert.equal(isPricingPaidCtaDisabled(PRICING_AUTH_STATUS.LOADING, false), true);
assert.equal(isPricingPaidCtaDisabled(PRICING_AUTH_STATUS.ERROR, false), true);
assert.equal(isPricingPaidCtaDisabled(PRICING_AUTH_STATUS.UNAUTHENTICATED, false), false);
assert.equal(isPricingPaidCtaDisabled(PRICING_AUTH_STATUS.AUTHENTICATED, false), false);

assert.match(pricingPage, /PRICING_AUTH_STATUS\.LOADING/);
assert.match(pricingPage, /getPricingCheckoutAction\(\{\s*planId,\s*authStatus,\s*session\s*\}\)/);
assert.match(pricingPage, /disabled=\{paidPlanCtaDisabled\}/);
assert.match(pricingController, /getPricingCheckoutAction\(\{\s*planId,\s*authStatus,\s*session\s*\}\)/);
assert.match(pricingController, /authStatus/);
assert.match(checkoutPage, /PRICING_AUTH_STATUS\.LOADING/);
assert.match(checkoutPage, /authStatus/);
assert.match(checkoutPage, /authStatus,\s*searchParams/);

for (const source of [pricingPage, pricingController]) {
  assert.match(source, /settings:\s*\{\s*locale:\s*['"]en['"]\s*\}/);
  assert.equal(hasTopLevelProperty(extractCheckoutObject(source), 'locale'), false);
  assert.match(source, /resolvePaddleEnvironment/);
  assert.match(source, /validatePaddleClientToken/);
}

console.log('R38J pricing session-loading race behavior tests passed.');
