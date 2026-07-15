import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const photographerCta = fs.readFileSync(path.join(root, 'src/app/for-photographers/ForPhotographersCta.js'), 'utf8');
const photographerHeader = fs.readFileSync(path.join(root, 'src/app/for-photographers/ForPhotographersHeader.js'), 'utf8');
const eventRouter = fs.readFileSync(path.join(root, 'src/core/analytics/eventRouter.ts'), 'utf8');
const revenueWeightMap = fs.readFileSync(path.join(root, 'src/core/revenue/revenueWeightMap.ts'), 'utf8');
const signupPage = fs.readFileSync(path.join(root, 'src/app/signup/page.js'), 'utf8');
const authCallback = fs.readFileSync(path.join(root, 'src/app/auth/callback/page.js'), 'utf8');
const quoteRoute = fs.readFileSync(path.join(root, 'src/app/api/quotes/route.js'), 'utf8');
const invoiceRoute = fs.readFileSync(path.join(root, 'src/app/api/invoices/route.js'), 'utf8');

function compileTypeScript(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function importCode(source) {
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const eventsModule = await importCode(compileTypeScript(path.join(root, 'src/core/analytics/events.ts')));
const normalizerModule = await importCode(
  compileTypeScript(path.join(root, 'src/core/analytics/eventNormalizer.ts'))
    .replace("from './events';", `from 'data:text/javascript;base64,${Buffer.from(compileTypeScript(path.join(root, 'src/core/analytics/events.ts'))).toString('base64')}';`)
);
const routerModule = await importCode(
  compileTypeScript(path.join(root, 'src/core/analytics/eventRouter.ts')).replace(/^import .*?;\n/gm, '')
);
const sessionCode = compileTypeScript(path.join(root, 'src/core/analytics/session.ts'));
const dedupModule = await importCode(
  compileTypeScript(path.join(root, 'src/core/analytics/dedup.ts'))
    .replace("from './session';", `from 'data:text/javascript;base64,${Buffer.from(sessionCode).toString('base64')}';`)
);
const { EVENTS } = eventsModule;
const { normalizeEvent } = normalizerModule;
const { isAnalyticsDebugEnabled } = routerModule;
const { isDuplicateEvent } = dedupModule;
const revenueModule = await importCode(
  compileTypeScript(path.join(root, 'src/core/revenue/revenueWeightMap.ts'))
    .replace("from '../analytics/events';", `from 'data:text/javascript;base64,${Buffer.from(compileTypeScript(path.join(root, 'src/core/analytics/events.ts'))).toString('base64')}';`)
);

const activationEvents = [
  'photographer_cta_click',
  'signup_completed',
  'first_quote_created',
  'first_invoice_created',
];

for (const eventName of activationEvents) {
  assert.ok(
    Object.values(EVENTS).includes(eventName),
    `${eventName} must be registered as a canonical analytics event`
  );
  assert.equal(
    normalizeEvent(eventName).event,
    eventName,
    `${eventName} must remain unchanged through normalization`
  );
}
assert.equal(
  normalizeEvent('SIGNUP_COMPLETED').event,
  EVENTS.SIGNUP_COMPLETED,
  'legacy uppercase SIGNUP_COMPLETED must remain compatible through the normalizer'
);

assert.equal(typeof isAnalyticsDebugEnabled, 'function', 'event router must expose the debug_analytics query helper');
assert.equal(isAnalyticsDebugEnabled('?debug_analytics=1'), true, 'debug_analytics=1 must opt GA4 events into DebugView');
assert.equal(isAnalyticsDebugEnabled('?debug_analytics=0'), false, 'debug_analytics=0 must not opt GA4 events into DebugView');
assert.equal(isAnalyticsDebugEnabled('?analytics_debug=1'), false, 'only the documented debug_analytics flag must enable GA4 debug mode');
assert.match(eventRouter, /gaPayload\.debug_mode\s*=\s*true/, 'the GA4 payload must include debug_mode when debug analytics is enabled');

assert.match(
  photographerCta,
  /sendEvent\('photographer_cta_click'/,
  'the photographer page CTA must emit photographer_cta_click through the registry'
);
assert.match(
  photographerHeader,
  /sendEvent\('photographer_cta_click'/,
  'the photographer header CTA must emit photographer_cta_click through the registry'
);
assert.doesNotMatch(photographerCta, /\bgtag\s*\(/, 'the photographer CTA must not call GA directly');
assert.doesNotMatch(photographerHeader, /\bgtag\s*\(/, 'the photographer header CTA must not call GA directly');

assert.doesNotMatch(dashboard, /const consumeSignupStarted = \(\) => false;/, 'signup completion must not be guarded by an always-false stub');
assert.match(signupPage, /data\?\.user\?\.identities\?\.length[\s\S]{0,300}?sendEvent\('signup_completed'/, 'a real new Supabase account must emit signup_completed');
assert.doesNotMatch(authCallback, /trackSignupCompleted\(/, 'callback sign-ins must not be counted as new signups');
assert.match(
  dashboard,
  /claimAndEmitFirstActivation\([\s\S]{0,300}?documentType: 'quote'/,
  'first_quote_created must emit only after the API grants the durable first-event claim'
);
assert.match(
  dashboard,
  /claimAndEmitFirstActivation\([\s\S]{0,300}?documentType: 'invoice'/,
  'first_invoice_created must emit only after the API grants the durable first-event claim'
);
assert.match(dashboard, /claimAndEmitFirstActivation\(\{ documentType: 'quote'/, 'quote activation must be consent-gated after save');
assert.match(dashboard, /claimAndEmitFirstActivation\(\{ documentType: 'invoice'/, 'invoice activation must be consent-gated after save');
const quoteGet = quoteRoute.slice(quoteRoute.indexOf('export async function GET'), quoteRoute.indexOf('export async function POST'));
const quotePost = quoteRoute.slice(quoteRoute.indexOf('export async function POST'), quoteRoute.indexOf('export async function PATCH'));
const invoiceGet = invoiceRoute.slice(invoiceRoute.indexOf('export async function GET'), invoiceRoute.indexOf('export async function POST'));
const invoicePost = invoiceRoute.slice(invoiceRoute.indexOf('export async function POST'), invoiceRoute.indexOf('export async function PATCH'));
assert.doesNotMatch(quoteGet, /claimFirstActivationEvent|activationClaim/, 'quote GET must not claim activation events');
assert.doesNotMatch(invoiceGet, /claimFirstActivationEvent|activationClaim/, 'invoice GET must not claim activation events');
assert.doesNotMatch(quotePost, /claimFirstActivationEvent|activationClaim|activation_event|activation_claimed/, 'quote POST must not claim activation events');
assert.doesNotMatch(invoicePost, /claimFirstActivationEvent|activationClaim|activation_event|activation_claimed/, 'invoice POST must not claim activation events');
assert.match(
  eventRouter,
  /isDuplicateEvent\(eventName, rawMetadata\)/,
  'activation events must use the existing router duplicate protection'
);
for (const eventKey of ['PHOTOGRAPHER_CTA_CLICK', 'FIRST_QUOTE_CREATED', 'FIRST_INVOICE_CREATED']) {
  assert.match(
    revenueWeightMap,
    new RegExp(`\\[EVENTS\\.${eventKey}\\]: 0`),
    `${eventKey} must remain analytics-only and not change revenue scoring`
  );
}
assert.equal(revenueModule.getEventRevenueWeight('signup_completed'), 60, 'lowercase signup_completed preserves the approved revenue score');

const sessionStorageValues = new Map();
globalThis.window = {};
globalThis.sessionStorage = {
  getItem: (key) => sessionStorageValues.get(key) ?? null,
  setItem: (key, value) => sessionStorageValues.set(key, String(value)),
};
assert.equal(isDuplicateEvent('first_quote_created'), false, 'the first successful quote event must emit once');
assert.equal(isDuplicateEvent('first_quote_created'), true, 'a duplicate first quote event in the same session must be blocked');
assert.equal(isDuplicateEvent('first_invoice_created'), false, 'the first successful invoice event must emit once');
assert.equal(isDuplicateEvent('first_invoice_created'), true, 'a duplicate first invoice event in the same session must be blocked');

console.log('GA4 activation event contract tests passed.');
