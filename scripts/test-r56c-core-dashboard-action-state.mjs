import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildNeedsAttention,
  CORE_DASHBOARD_ACTION_AUTHORITY,
  deriveDocumentUsageState,
  derivePaymentProgressState,
} from '../src/components/dashboard/dashboardWave1.mjs';

const dashboard = fs.readFileSync('src/components/dashboard/Dashboard.js', 'utf8');
const overview = fs.readFileSync('src/app/dashboard/components/DashboardOverview.js', 'utf8');
const dashboardData = fs.readFileSync('src/hooks/useDashboardData.js', 'utf8');

const approved = buildNeedsAttention({
  quotes: [{ id: 'quote-approved-1', quote_number: 'QT-1', status: 'approved' }],
  invoices: [],
})[0];
assert.equal(approved.action, 'createInvoiceFromQuote');
assert.equal(approved.actionLabel, 'Create invoice');
assert.equal(approved.documentId, 'quote-approved-1');
assert.equal(CORE_DASHBOARD_ACTION_AUTHORITY.approvedQuote.action, 'createInvoiceFromQuote');
assert.equal(CORE_DASHBOARD_ACTION_AUTHORITY.approvedQuote.label, 'Create invoice');
assert.deepEqual(
  Object.fromEntries(Object.entries(CORE_DASHBOARD_ACTION_AUTHORITY).map(([key, value]) => [key, value.action])),
  {
    draftQuote: 'openQuotes',
    sentQuote: 'openQuotes',
    approvedQuote: 'createInvoiceFromQuote',
    pastDueInvoice: 'openInvoices',
    partialInvoice: 'openInvoices',
    unpaidInvoice: 'openInvoices',
    createQuote: 'createQuote',
    createInvoice: 'createInvoice',
    recordPayment: 'recordPayment',
    exportPdf: 'exportPdf',
  },
  'core actions remain mapped to their canonical handlers',
);

const payment = derivePaymentProgressState([
  { id: 'unpaid', currency: 'USD', total: 10000, amount_paid_cents: 0, amount_due_cents: 10000, payment_status: 'unpaid' },
  { id: 'partial', currency: 'USD', total: 20000, amount_paid_cents: 5000, amount_due_cents: 15000, payment_status: 'partial' },
  { id: 'paid', currency: 'USD', total: 30000, amount_paid_cents: 30000, amount_due_cents: 0, payment_status: 'paid' },
]);
assert.equal(payment.paidAmountCents, 35000);
assert.equal(payment.outstandingAmountCents, 25000);
assert.equal(payment.needsPaymentCount, 2);
assert.deepEqual(payment.currencies, [{ currency: 'USD', paidAmountCents: 35000, outstandingAmountCents: 25000, needsPaymentCount: 2 }]);

const multiCurrency = derivePaymentProgressState([
  { currency: 'USD', total: 10000, amount_paid_cents: 10000, amount_due_cents: 0, payment_status: 'paid' },
  { currency: 'EUR', total: 10000, amount_paid_cents: 0, amount_due_cents: 10000, payment_status: 'unpaid' },
]);
assert.equal(multiCurrency.paidAmountCents, null);
assert.equal(multiCurrency.outstandingAmountCents, null);
assert.equal(multiCurrency.needsPaymentCount, 1);
assert.equal(multiCurrency.currencies.length, 2);

assert.deepEqual(deriveDocumentUsageState({ documentsUsed: 4, documentsLimit: 5 }, 'free'), {
  status: 'ready', used: 4, limit: 5, label: '4 / 5', source: 'server_immutable_usage', plan: 'free',
});
assert.equal(deriveDocumentUsageState(null, 'free').status, 'unavailable');
assert.equal(deriveDocumentUsageState(null, 'free').used, null);

assert.match(dashboard, /createInvoiceFromQuote\s*:/);
assert.match(dashboard, /handleConvertQuoteToInvoice/);
assert.match(dashboard, /invoice-draft/);
assert.match(overview, /Payment status|Payments/);
assert.match(overview, /deriveDocumentUsageState/);
assert.doesNotMatch(dashboard, /<span>🔔 Reminder<\/span>/);
assert.match(dashboardData, /setInvoicesError/);
assert.match(dashboardData, /clearOnHttpError:\s*false/);
assert.match(dashboard, /error:\s*dashboardDataError\s*\|\|\s*quotesError\s*\|\|\s*invoicesError/);

console.log('R56C CORE DASHBOARD ACTION STATE TEST=PASS');
