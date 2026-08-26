import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveInvoicePaymentState,
  resolveInvoicePaymentReadModel,
} from '../src/core/revenue/invoicePaymentState.js';

const read = (path) => fs.readFileSync(path, 'utf8');
const paymentRoutePath = 'src/app/api/invoices/[id]/payments/route.js';
const paymentModelPath = 'src/core/revenue/invoicePaymentState.js';
const invoiceRoute = read('src/app/api/invoices/route.js');
const dashboard = read('src/components/dashboard/Dashboard.js');
const paymentMigration = read('supabase/migrations/20260821190820_payment_idempotency.sql');
const remediationMigration = read('supabase/migrations/20260821191944_payment_rpc_cleanup.sql');

assert.ok(fs.existsSync(paymentRoutePath), 'payment recording route must exist in the Phase 3 commit');
assert.ok(fs.existsSync(paymentModelPath), 'payment read model must remain in the Phase 3 commit');
const paymentRoute = read(paymentRoutePath);
const paymentModel = read(paymentModelPath);

function extractNamedFunction(source, name) {
  const signature = `export function ${name}`;
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `${name} must be exported from Dashboard so its retry contract can be exercised`);
  const bodyStart = source.indexOf('{', start);
  assert.notEqual(bodyStart, -1, `${name} must have a function body`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`${name} must have balanced braces`);
}

function loadRecordPaymentAttemptStore() {
  const source = extractNamedFunction(dashboard, 'createRecordPaymentAttemptStore');
  return new Function(`${source.replace('export ', '')}; return createRecordPaymentAttemptStore;`)();
}

function makeStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    getItem(key) {
      calls.push(['getItem', key]);
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      calls.push(['setItem', key, value]);
      values.set(key, value);
    },
    removeItem(key) {
      calls.push(['removeItem', key]);
      values.delete(key);
    },
  };
}

assert.match(paymentRoute, /record_invoice_payment/);
assert.match(paymentRoute, /\.eq\('user_id', context\.user\.id\)/);
assert.match(paymentRoute, /amountCents <= 0/);
assert.match(paymentRoute, /idempotency-key/i);
assert.match(paymentRoute, /p_idempotency_key/);
assert.match(paymentRoute, /status: 409/);
assert.match(invoiceRoute, /Payment records determine paid state/);
assert.match(invoiceRoute, /payment_status/);
assert.match(invoiceRoute, /amount_paid_cents/);
assert.match(invoiceRoute, /amount_due_cents/);
assert.match(dashboard, /Record Payment/);
assert.match(dashboard, /\/api\/invoices\/\$\{.*\}\/payments/);
assert.match(paymentModel, /PAYMENT_STATUSES\.PARTIAL/);
assert.match(paymentModel, /PAYMENT_STATUSES\.OVERDUE/);
assert.match(paymentModel, /Math\.max\(totalCents - amountPaidCents, 0\)/);
assert.deepEqual(
  deriveInvoicePaymentState({ total: 100000, amount_paid_cents: 0, due_date: '2099-01-01' }).paymentStatus,
  'unpaid'
);
assert.deepEqual(deriveInvoicePaymentState({ total: 100000, amount_paid_cents: 40000 }).paymentStatus, 'partial');
assert.deepEqual(resolveInvoicePaymentReadModel({ total: 100000, amount_paid_cents: 100000 }).amount_due_cents, 0);
assert.match(paymentMigration, /idempotency_key/);
assert.match(paymentMigration, /CREATE UNIQUE INDEX/);
assert.match(paymentMigration, /record_invoice_payment/);
assert.match(remediationMigration, /DROP FUNCTION public\.record_invoice_payment\(UUID, UUID, INTEGER, TEXT, TEXT, TIMESTAMPTZ\)/);
assert.match(remediationMigration, /invoice_payment_exceeds_amount_due/);
assert.match(remediationMigration, /invoice_payment_idempotency_key_reused/);
assert.match(remediationMigration, /existing_payment\.amount_cents/);
assert.match(remediationMigration, /existing_payment\.currency/);
assert.match(remediationMigration, /existing_payment\.source/);
assert.match(remediationMigration, /total_paid \+ p_amount_cents > invoice_row\.total/);

assert.match(dashboard, /export function createRecordPaymentAttemptStore/, 'Dashboard must expose the real retry-key store for contract coverage');
assert.match(dashboard, /sessionStorage/, 'Dashboard must persist Record Payment attempt keys in browser sessionStorage');
assert.match(dashboard, /crypto\.randomUUID/, 'Dashboard must create new Record Payment keys with crypto.randomUUID');
assert.match(dashboard, /Idempotency-Key.*idempotencyKey/, 'Dashboard must forward the stored key in the Idempotency-Key header');
assert.match(dashboard, /idempotency_key:\s*idempotencyKey/, 'Dashboard must forward the exact stored key in the body');
assert.match(dashboard, /createRecordPaymentAttemptStore[\s\S]*?const response = await fetch/s, 'Dashboard must persist/resolve the attempt key before fetch');

const createRecordPaymentAttemptStore = loadRecordPaymentAttemptStore();
const firstStorage = makeStorage();
let uuidCount = 0;
const makeUuid = () => `00000000-0000-4000-8000-${String(++uuidCount).padStart(12, '0')}`;
const firstStore = createRecordPaymentAttemptStore(firstStorage, makeUuid);
const first = firstStore.getOrCreate({ invoiceId: 'invoice-1', currency: 'usd', amountCents: 1250 });
assert.equal(first.idempotencyKey, '00000000-0000-4000-8000-000000000001', 'first logical payment attempt creates one UUID');
assert.equal(firstStorage.calls.findIndex(([name]) => name === 'setItem') > -1, true, 'the key is persisted before the request contract can continue');
assert.match(first.storageKey, /^corvioz:record-payment-attempt:invoice-1:USD:1250$/, 'storage scope includes invoice, normalized currency, and integer cents');

const retried = firstStore.getOrCreate({ invoiceId: 'invoice-1', currency: 'USD', amountCents: 1250 });
assert.equal(retried.idempotencyKey, first.idempotencyKey, 'ambiguous in-page retry reuses the exact UUID');
assert.equal(uuidCount, 1, 'in-page retry does not generate another UUID');

const reloadedStore = createRecordPaymentAttemptStore(firstStorage, makeUuid);
const reloaded = reloadedStore.getOrCreate({ invoiceId: 'invoice-1', currency: 'usd', amountCents: 1250 });
assert.equal(reloaded.idempotencyKey, first.idempotencyKey, 'session reload retry reuses the persisted UUID');
assert.equal(uuidCount, 1, 'reload retry does not generate another UUID');

assert.equal(firstStore.shouldClearAfterResponse({ ok: false, status: 500 }), false, 'ambiguous 5xx does not clear the key');
assert.equal(firstStore.shouldClearAfterResponse({ ok: false, status: 408 }), false, 'ambiguous timeout does not clear the key');
assert.equal(firstStore.getOrCreate({ invoiceId: 'invoice-1', currency: 'USD', amountCents: 1250 }).idempotencyKey, first.idempotencyKey, 'network failure without cleanup preserves the key');

assert.equal(firstStore.shouldClearAfterResponse({ ok: true, status: 201 }), true, 'success is terminal');
assert.equal(firstStore.shouldClearAfterResponse({ ok: false, status: 400 }), true, 'deterministic validation 4xx is terminal');
assert.equal(firstStore.shouldClearAfterResponse({ ok: false, status: 403 }), true, 'ownership/auth denial is terminal');
assert.equal(firstStore.shouldClearAfterResponse({ ok: false, status: 409 }), true, 'semantic idempotency conflict is terminal');

firstStore.clear(first.storageKey);
const laterSameAmount = firstStore.getOrCreate({ invoiceId: 'invoice-1', currency: 'USD', amountCents: 1250 });
assert.equal(laterSameAmount.idempotencyKey, '00000000-0000-4000-8000-000000000002', 'same amount after terminal cleanup creates a new UUID');

const unavailableStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
assert.throws(
  () => createRecordPaymentAttemptStore(unavailableStorage, makeUuid).getOrCreate({ invoiceId: 'invoice-2', currency: 'USD', amountCents: 1 }),
  /Unable to persist a retry-safe Record Payment attempt/,
  'sessionStorage failure must fail closed before any payment request'
);

assert.match(paymentRoute, /p_idempotency_key:\s*idempotencyKey/, 'API route forwards the exact supplied key to the RPC');
assert.match(paymentRoute, /rpc\(['"]record_invoice_payment['"],\s*\{[\s\S]*?p_idempotency_key:\s*idempotencyKey/s, 'seven-argument payment RPC contract remains present');
assert.match(read('src/app/lib/supabase.js'), /create_invoice_draft_from_approved_quote/, 'Quote conversion remains dedicated-RPC based');
assert.match(invoiceRoute, /status === 'paid'[\s\S]*Payment records determine paid state/s, 'direct PATCH status=paid remains blocked');

console.log('PHASE3_PAYMENT_LEDGER_RUNTIME=PASS');
