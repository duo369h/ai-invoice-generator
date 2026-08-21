#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  paymentRoute: 'src/app/api/invoices/[id]/payments/route.js',
  invoicesRoute: 'src/app/api/invoices/route.js',
  portalToken: 'src/app/api/portal/token/[token]/route.js',
  portalDoc: 'src/app/api/portal/doc/[id]/route.js',
  portalClient: 'src/app/components/PortalClientView.js',
};
const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(path.join(root, file), 'utf8')]));
let passed = 0;
const failures = [];
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL: ${name}`);
  }
}
function walk(directory, results = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, results);
    else if (/\.(js|ts)$/.test(entry.name)) results.push(full);
  }
  return results;
}

for (const [label, value] of [['portal token route', source.portalToken], ['portal document route', source.portalDoc]]) {
  check(`${label}: client payment action is explicitly rejected with 409`, /action === 'pay'/.test(value) && /Payment must be recorded by the photographer or payment provider/.test(value) && /status:\s*409/.test(value));
  check(`${label}: no invoice_payments access exists`, !/from\(\s*['"]invoice_payments['"]\s*\)/.test(value));
  check(`${label}: no direct paid status object write exists`, !/\.update\(\s*\{[^}]*\bstatus\s*:\s*['"]paid['"]/s.test(value));
  check(`${label}: no paid audit event exists`, !/portal_invoice_paid/.test(value));
  check(`${label}: no paid email trigger exists`, !/sendInvoicePaidEmail/.test(value));
}

check('portal UI: no Confirm Paid control exists', !/Confirm Paid/.test(source.portalClient));
check('portal UI: no local mark-paid handler exists', !/handleMarkPaid/.test(source.portalClient));
check('portal UI: no client pay write request exists', !/JSON\.stringify\(\{\s*action:\s*['"]pay['"]\s*\}\)/.test(source.portalClient));
check('portal UI: payment status is rendered from the document', /const paymentStatus =/.test(source.portalClient) && /doc\.payment_status/.test(source.portalClient));
check('portal UI: partial settlement remains visibly distinct', /Partial payment recorded/.test(source.portalClient) && /paymentStatus === 'partial'/.test(source.portalClient));
check('portal UI: payment actions are hidden once paid', /paymentStatus !== 'paid'/.test(source.portalClient));
check('portal UI: payment link remains a checkout affordance only', /doc\.payment_link/.test(source.portalClient) && /Pay\s*\{currencySymbol\}/.test(source.portalClient));

const patchStart = source.invoicesRoute.indexOf('export async function PATCH');
const patchEnd = source.invoicesRoute.indexOf('export async function DELETE');
const patchBody = source.invoicesRoute.slice(patchStart, patchEnd === -1 ? undefined : patchEnd);
const paymentGuard = patchBody.indexOf("const paymentTruthFields = ['payment_status', 'amount_paid_cents', 'amount_due_cents']");
const updateStatus = patchBody.indexOf('.update({ status })');
check('invoice PATCH: payment truth field guard exists', paymentGuard !== -1);
check('invoice PATCH: payment status is a guarded truth field', /paymentTruthFields\.some/.test(patchBody) && /hasOwnProperty\.call\(body, field\)/.test(patchBody));
check('invoice PATCH: paid status is rejected', /if \(status === 'paid'\)/.test(patchBody) && /Payment records determine paid state/.test(patchBody));
check('invoice PATCH: paid guard precedes status update', patchBody.indexOf("if (status === 'paid')") < updateStatus);
check('invoice PATCH: direct payment RPC is absent', !/record_invoice_payment/.test(patchBody));
check('invoice PATCH: payment field rejection precedes draft write', paymentGuard !== -1 && paymentGuard < patchBody.indexOf("if (id && !status)"));

check('payment endpoint: authoritative RPC is used', /\.rpc\('record_invoice_payment'/.test(source.paymentRoute));
check('payment endpoint: no invoice_payments insert bypass exists', !/from\(\s*['"]invoice_payments['"]\s*\)/.test(source.paymentRoute));
check('payment endpoint: fully paid rows are not preemptively rejected', !/existing\.payment_status\s*===\s*['"]paid['"]/.test(source.paymentRoute));
check('payment endpoint: draft rows remain ineligible', /existing\.status\s*===\s*['"]draft['"]/.test(source.paymentRoute));
check('payment endpoint: due conflict maps to 409', /invoice_payment_exceeds_amount_due:\s*409/.test(source.paymentRoute));
check('payment endpoint: idempotency conflict maps to 409', /invoice_payment_idempotency_key_reused:\s*409/.test(source.paymentRoute));
check('payment endpoint: currency conflict maps to 409', /invoice_payment_currency_mismatch:\s*409/.test(source.paymentRoute));
check('payment endpoint: missing invoice maps to 404', /invoice_not_found:\s*404/.test(source.paymentRoute));
check('payment endpoint: unknown errors are generic 500 responses', /Failed to record payment/.test(source.paymentRoute) && /status:\s*500/.test(source.paymentRoute));
check('payment endpoint: side effects are all-settled after the RPC', /Promise\.allSettled/.test(source.paymentRoute));
check('payment endpoint: side-effect failures are logged', /failed after payment commit/.test(source.paymentRoute));

const apiFiles = walk(path.join(root, 'src/app/api'));
const directPaidWrite = /\bstatus\s*(?::|=(?!=))\s*(['"])paid\1/;
check(`API scan: no direct paid-status writes across ${apiFiles.length} route files`, apiFiles.every((file) => !directPaidWrite.test(readFileSync(file, 'utf8'))));
check('API scan: no direct payment ledger inserts outside the payment RPC', apiFiles.every((file) => !/from\(\s*['"]invoice_payments['"]\s*\)\s*\.insert/.test(readFileSync(file, 'utf8'))));
check('payment endpoint: side effects cannot alter RPC error mapping', source.paymentRoute.indexOf('rpcErrorResponse(error)') < source.paymentRoute.indexOf('runNonBlockingPaymentSideEffects'));
check('invoice route: legacy sent workflow remains intact', /invoice_sent_timestamp/.test(source.invoicesRoute) && /eventName:\s*'invoice_sent'/.test(source.invoicesRoute));
check('portal token: quote approval remains intact', /action === 'approve'/.test(source.portalToken) && /status: 'approved'/.test(source.portalToken));
check('portal token: quote decline remains intact', /action === 'reject'/.test(source.portalToken) && /status: 'declined'/.test(source.portalToken));
check('portal document: quote approval remains intact', /action === 'approve'/.test(source.portalDoc) && /status: 'approved'/.test(source.portalDoc));

if (failures.length) {
  console.error(`\nPayment paid-write guardrails: ${passed} passed, ${failures.length} failed.`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}
console.log(`\nPayment paid-write guardrails: ${passed} passed, 0 failed.`);
