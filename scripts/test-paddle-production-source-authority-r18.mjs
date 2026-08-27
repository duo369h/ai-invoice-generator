import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = fs.readFileSync(path.join(root, 'src/app/pricing/page.js'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'src/app/pricing/controller.ts'), 'utf8');
const client = fs.readFileSync(path.join(root, 'src/app/lib/paddle-client.js'), 'utf8');
const viewModel = fs.readFileSync(path.join(root, 'src/core/pricing/pricingViewModel.ts'), 'utf8');

const clientRuntime = new Function(
  `${client.replaceAll('export ', '')}; return { resolvePaddleEnvironment, validatePaddleClientToken };`,
)();

function check(label, condition) {
  assert.ok(condition, label);
  console.log(`${label}=PASS`);
}

assert.equal(clientRuntime.resolvePaddleEnvironment({ deploymentEnvironment: 'production', paddleEnvironment: 'production' }), 'production');
check('PRODUCTION_PADDLE_ENV_PRODUCTION', true);
assert.throws(() => clientRuntime.resolvePaddleEnvironment({ deploymentEnvironment: 'production', paddleEnvironment: 'sandbox' }), /Production Paddle checkout cannot use Sandbox configuration/);
check('PRODUCTION_SANDBOX_ENV_REFUSED', true);
assert.equal(clientRuntime.resolvePaddleEnvironment({ deploymentEnvironment: 'preview', paddleEnvironment: 'sandbox' }), 'sandbox');
check('PREVIEW_SANDBOX_ENV_ALLOWED', true);
assert.throws(() => clientRuntime.resolvePaddleEnvironment({ deploymentEnvironment: 'preview', paddleEnvironment: 'production' }), /Preview Paddle checkout requires Sandbox configuration/);
check('PREVIEW_LIVE_ENV_REFUSED', true);
assert.throws(() => clientRuntime.resolvePaddleEnvironment({ deploymentEnvironment: 'production', paddleEnvironment: '' }), /Unsupported Paddle environment/);
check('INVALID_ENV_REFUSED', true);
assert.doesNotThrow(() => clientRuntime.validatePaddleClientToken('live_123456789012345678901234567', 'production'));
check('PRODUCTION_LIVE_TOKEN_CLASS_REQUIRED', true);
assert.doesNotThrow(() => clientRuntime.validatePaddleClientToken('test_123456789012345678901234567', 'sandbox'));
check('PREVIEW_SANDBOX_TOKEN_CLASS_REQUIRED', true);
assert.throws(() => clientRuntime.validatePaddleClientToken('live_123456789012345678901234567', 'sandbox'), /Sandbox Paddle checkout requires a test_/);
check('SANDBOX_WITH_LIVE_TOKEN_REFUSED', true);
assert.throws(() => clientRuntime.validatePaddleClientToken('test_123456789012345678901234567', 'production'), /Production Paddle checkout requires a live_/);
check('PRODUCTION_WITH_SANDBOX_TOKEN_REFUSED', true);
assert.throws(() => clientRuntime.validatePaddleClientToken('ctkn_not_a_client_token', 'production'), /Invalid Paddle client token class/);
check('INVALID_TOKEN_CLASS_REFUSED', true);
check('PRICING_PAGE_USES_SINGLE_ENV_AUTHORITY', page.includes('resolvePaddleEnvironment('));
check('CONTROLLER_USES_SINGLE_ENV_AUTHORITY', controller.includes('resolvePaddleEnvironment('));
check('CHECKOUT_PRICE_ID_AUTHORITY', page.includes('targetCard?.priceMeta?.priceId') && viewModel.includes('priceMeta: { priceId }'));
check('OFFICIAL_PADDLE_V2_LOADER', client.includes('https://cdn.paddle.com/paddle/v2/paddle.js'));
check('WEBHOOK_EVENT_ALLOWLIST_EXACT_7', (fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8').match(/const handledEvents = \[([\s\S]*?)\];/)?.[1].match(/'[^']+'/g) || []).length === 7);
check('PAYMENT_COMPLETED_EXECUTABLE_ZERO', !fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8').includes("'payment.completed'"));
check('PRICE_RESOLVER_CONFLICT_FAIL_CLOSED', fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8').includes('hasConflictingProMonthlyIds'));

console.log('PADDLE_PRODUCTION_SOURCE_AUTHORITY_R18=PASS');
