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

console.log('PHASE3_PAYMENT_LEDGER_RUNTIME=PASS');
