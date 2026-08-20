import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const invoiceRoute = read('src/app/api/invoices/route.js');
const portalRoute = read('src/app/api/portal/token/[token]/route.js');
const tokenlessPortalRoute = read('src/app/api/portal/doc/[id]/route.js');
const portalTokenRoute = read('src/app/api/portal/token/generate/route.js');
const portalView = read('src/app/components/PortalClientView.js');
const revenueValidationRoute = read('src/app/api/product/revenue-validation/route.js');
const schema = read('supabase/schema.sql');
const migration = read('supabase/migration-invoice-payment-foundation.sql');

assert.ok(
  fs.existsSync(path.join(root, 'src/app/api/invoices/[id]/payments/route.js')),
  'payment recording must have a dedicated invoice endpoint'
);
assert.ok(
  invoiceRoute.includes("if (status === 'paid')") && invoiceRoute.includes('Payment records determine paid state'),
  'invoice PATCH must reject direct paid state changes'
);
assert.ok(
  !portalRoute.includes(".update({ status: 'paid'"),
  'anonymous portal actions must not write invoice paid status directly'
);
assert.ok(
  !tokenlessPortalRoute.includes(".update({ status: 'paid'") && !portalView.includes('Confirm Paid'),
  'no portal surface may retain a client-controlled paid action'
);
assert.ok(
  portalView.includes('payment_status') && revenueValidationRoute.includes('payment_status'),
  'portal and revenue reporting must consume collection state instead of document status'
);
assert.ok(
  portalTokenRoute.includes('!entitlements.client_portal'),
  'portal token generation requires client_portal entitlement'
);
assert.ok(
  migration.includes('CREATE TABLE IF NOT EXISTS public.invoice_payments')
    && migration.includes('record_invoice_payment')
    && migration.includes('amount_due_cents'),
  'payment migration must provide a ledger, settlement function, and invoice rollup'
);
assert.ok(
  schema.includes('ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY')
    && schema.includes('Users can view own invoice payments'),
  'the base schema must retain owner-read and server-write payment protections'
);

console.log('Invoice payment API contracts passed.');
