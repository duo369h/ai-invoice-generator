import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const dashboard = read('src/components/dashboard/Dashboard.js');
const revenueHook = read('src/app/lib/revenue/useRevenueDecision.ts');
const checkoutController = read('src/app/pricing/controller.ts');
const controlPlane = read('src/app/api/revenue/control-plane/route.ts');

// Record Payment is an actual form flow, not a browser capability-dependent prompt.
assert.doesNotMatch(dashboard, /window\.prompt\s*\(/, 'Record Payment must not use window.prompt');
assert.match(dashboard, /openRecordPaymentModal/, 'Record Payment must open a first-party modal');
assert.match(dashboard, /data-testid="record-payment-modal"/, 'Record Payment modal needs a stable QA boundary');
assert.match(dashboard, /role="dialog"[\s\S]*?aria-modal="true"/, 'Record Payment modal must be accessible');
assert.match(dashboard, /id="record-payment-amount"[\s\S]*?type="number"/, 'Record Payment must collect a numeric amount');
assert.match(dashboard, />Cancel<\/button>/, 'Record Payment must expose a cancel action');
assert.match(dashboard, />{isRecordingPayment \? 'Recording\.\.\.' : 'Record payment'}<\/button>/, 'Record Payment must expose a submit action');
assert.match(dashboard, /Idempotency-Key.*idempotencyKey/, 'Record Payment must retain retry-safe idempotency');
assert.match(dashboard, /setRecordPaymentInvoice\(null\)/, 'Successful Record Payment must close the modal');

// A control-plane outage is explicitly a UI-only continuation; server routes remain authoritative.
assert.match(revenueHook, /export function buildApiUnavailableDecision/);
assert.match(revenueHook, /evaluationAvailable: false/);
assert.match(revenueHook, /serverAuthorityRequired: true/);
assert.match(revenueHook, /ui_only_fallback/);
assert.match(revenueHook, /server_authority_fail_closed/);
assert.doesNotMatch(revenueHook, /safety_fallback_allow/);
assert.match(controlPlane, /requireInternalAdmin/);

// Checkout must never initialize Paddle with a placeholder token or implicit environment.
assert.doesNotMatch(checkoutController, /test_token_placeholder/);
assert.match(checkoutController, /Paddle Sandbox checkout configuration is missing or contains a placeholder/);
assert.match(checkoutController, /const activeEnv = env/);
assert.match(checkoutController, /const activeToken = token/);

console.log('FIRST_RELEASE_QA_REMEDIATION_R3_SOURCE_REGRESSIONS=PASS');
