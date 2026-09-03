import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  derivePaymentProgressState,
} from '../src/components/dashboard/dashboardWave1.mjs';

const dashboard = fs.readFileSync('src/components/dashboard/Dashboard.js', 'utf8');
const overview = fs.readFileSync('src/app/dashboard/components/DashboardOverview.js', 'utf8');
const dashboardData = fs.readFileSync('src/hooks/useDashboardData.js', 'utf8');

const draftInvoice = {
  status: 'draft',
  payment_status: 'unpaid',
  total: 20000,
  amount_paid_cents: 0,
  amount_due_cents: 20000,
  currency: 'USD',
};

const draftSummary = derivePaymentProgressState([draftInvoice]);
assert.equal(draftSummary.invoiceCount, 0, 'Draft Invoice is not an active payment obligation');
assert.equal(draftSummary.paidAmountCents, 0);
assert.equal(draftSummary.outstandingAmountCents, 0);
assert.equal(draftSummary.needsPaymentCount, 0);
assert.deepEqual(draftSummary.currencies, [], 'Draft Invoice does not create a currency group');

const sentSummary = derivePaymentProgressState([{ ...draftInvoice, status: 'sent' }]);
assert.equal(sentSummary.invoiceCount, 1, 'sent Invoice participates in payment summary');
assert.equal(sentSummary.outstandingAmountCents, 20000);
assert.equal(sentSummary.needsPaymentCount, 1);

const mixedSummary = derivePaymentProgressState([
  draftInvoice,
  { status: 'sent', payment_status: 'unpaid', currency: 'USD', total: 10000, amount_paid_cents: 0, amount_due_cents: 10000 },
  { status: 'sent', payment_status: 'partial', currency: 'USD', total: 20000, amount_paid_cents: 5000, amount_due_cents: 15000 },
  { status: 'sent', payment_status: 'paid', currency: 'USD', total: 30000, amount_paid_cents: 30000, amount_due_cents: 0 },
]);
assert.equal(mixedSummary.invoiceCount, 3);
assert.equal(mixedSummary.paidAmountCents, 35000);
assert.equal(mixedSummary.outstandingAmountCents, 25000);
assert.equal(mixedSummary.needsPaymentCount, 2);

const currencySummary = derivePaymentProgressState([
  { ...draftInvoice, currency: 'EUR' },
  { status: 'sent', payment_status: 'unpaid', currency: 'USD', total: 10000, amount_due_cents: 10000 },
]);
assert.equal(currencySummary.invoiceCount, 1);
assert.equal(currencySummary.currency, 'USD');
assert.equal(currencySummary.isMultiCurrency, false);

assert.match(overview, /Payment status unavailable/);
assert.match(overview, /may be out of date/i);
assert.match(overview, /invoicesError|invoiceRefreshError/);
assert.match(overview, /quotaError|quotaRefreshError/);
assert.match(overview, /retryDashboard/);
assert.match(dashboard, /invoicesError/);
assert.match(dashboard, /quotaError/);
assert.match(dashboardData, /setQuotaError/);

console.log('R56C1 PAYMENT STATE AUTHORITY TEST=PASS');
