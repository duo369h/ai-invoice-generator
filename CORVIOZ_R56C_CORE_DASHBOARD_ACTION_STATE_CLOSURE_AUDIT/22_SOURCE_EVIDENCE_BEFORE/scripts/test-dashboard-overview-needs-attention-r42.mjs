import assert from 'node:assert/strict';
import {
  buildNeedsAttention,
  getNeedsAttentionSurfaceState,
} from '../src/components/dashboard/dashboardWave1.mjs';

const now = new Date('2026-08-30T12:00:00Z');

const loadingSurface = getNeedsAttentionSurfaceState({ itemCount: 0, surfaceState: 'loading' });
assert.equal(loadingSurface.mode, 'loading', 'loading with no documents must remain a neutral checking state');
assert.notEqual(loadingSurface.title, 'Nothing needs your attention', 'loading must not show success empty copy');
assert.match(loadingSurface.title, /Checking your quotes and invoices/);

const errorSurface = getNeedsAttentionSurfaceState({ itemCount: 0, surfaceState: 'error', error: new Error('dashboard fetch failed') });
assert.equal(errorSurface.mode, 'error', 'error with no documents must remain unavailable');
assert.notEqual(errorSurface.title, 'Nothing needs your attention', 'error with no documents must not show success empty copy');
assert.match(errorSurface.title, /couldn't be loaded/);
assert.equal(errorSurface.showRetry, true, 'error state may reuse the existing Dashboard retry handler');

const successfulEmptySurface = getNeedsAttentionSurfaceState({ itemCount: 0, surfaceState: 'empty' });
assert.equal(successfulEmptySurface.mode, 'empty');
assert.equal(successfulEmptySurface.title, 'No quotes or invoices need attention right now.');

const staleSurface = getNeedsAttentionSurfaceState({
  itemCount: 1,
  surfaceState: 'ready',
  error: new Error('refresh failed'),
});
assert.equal(staleSurface.mode, 'stale', 'error with existing documents must retain available items');
assert.match(staleSurface.description, /latest available items/);
assert.equal(staleSurface.showRetry, false, 'stale list disclosure must not introduce a new fetch path');

const sourceData = {
  quotes: [
    { id: 'q-draft', quote_number: 'QT-DRAFT', client_name: 'Draft Client', status: 'draft', updated_at: '2026-08-29T10:00:00Z' },
    { id: 'q-sent', quote_number: 'QT-SENT', client_name: 'Sent Client', status: 'sent', updated_at: '2026-08-28T10:00:00Z' },
    { id: 'q-approved', quote_number: 'QT-APPROVED', client_name: 'Approved Client', status: 'approved', updated_at: '2026-08-27T10:00:00Z' },
    { id: 'q-declined', quote_number: 'QT-DECLINED', client_name: 'Declined Client', status: 'declined', updated_at: '2026-08-30T09:00:00Z' },
    { id: 'q-converted', quote_number: 'QT-CONVERTED', client_name: 'Converted Client', status: 'converted', updated_at: '2026-08-30T08:00:00Z' },
  ],
  invoices: [
    { id: 'i-paid', invoice_number: 'INV-PAID', client_name: 'Paid Client', status: 'sent', payment_status: 'paid', amount_due_cents: 0, updated_at: '2026-08-30T07:00:00Z' },
    { id: 'i-draft', invoice_number: 'INV-DRAFT', client_name: 'Draft Invoice Client', status: 'draft', payment_status: 'unpaid', amount_due_cents: 5000, due_date: '2026-08-20', updated_at: '2026-08-30T06:00:00Z' },
    { id: 'i-unpaid', invoice_number: 'INV-UNPAID', client_name: 'Unpaid Client', status: 'sent', payment_status: 'unpaid', amount_due_cents: 7000, due_date: '2026-09-10', updated_at: '2026-08-26T10:00:00Z' },
    { id: 'i-partial', invoice_number: 'INV-PARTIAL', client_name: 'Partial Client', status: 'sent', payment_status: 'partial', amount_paid_cents: 3000, amount_due_cents: 9000, due_date: '2026-09-12', updated_at: '2026-08-25T10:00:00Z' },
    { id: 'i-past-due', invoice_number: 'INV-PAST-DUE', client_name: 'Past Due Client', status: 'sent', payment_status: 'unpaid', total: 15000, amount_due_cents: 15000, due_date: '2026-08-20', updated_at: '2026-08-24T10:00:00Z' },
    { id: 'i-partial-past-due', invoice_number: 'INV-PARTIAL-PAST-DUE', client_name: 'Partial Past Due Client', status: 'sent', payment_status: 'partial', amount_paid_cents: 4000, amount_due_cents: 11000, due_date: '2026-08-19', updated_at: '2026-08-23T10:00:00Z' },
  ],
};
const sourceSnapshot = structuredClone(sourceData);
const items = buildNeedsAttention(sourceData, now);

assert.deepEqual(items.map(({ id, title }) => ({ id, title })), [
  { id: 'i-past-due', title: 'Past-due balance' },
  { id: 'i-partial-past-due', title: 'Past-due balance' },
  { id: 'i-partial', title: 'Remaining balance' },
  { id: 'q-approved', title: 'Ready to create invoice' },
  { id: 'i-unpaid', title: 'Payment not recorded' },
  { id: 'q-sent', title: 'Awaiting client decision' },
  { id: 'q-draft', title: 'Finish and send quote' },
]);

const pastDue = items.find(({ id }) => id === 'i-past-due');
assert.equal(pastDue.dueDate, '2026-08-20');
assert.equal(pastDue.amountDueCents, 15000);

const partialPastDue = items.find(({ id }) => id === 'i-partial-past-due');
assert.equal(partialPastDue.paymentStatus, 'partial', 'past-due projection must preserve the authoritative partial payment state');
assert.equal(partialPastDue.amountPaidCents, 4000);
assert.equal(partialPastDue.amountDueCents, 11000);
assert.equal(items.filter(({ id }) => id === 'i-partial-past-due').length, 1, 'one invoice must produce at most one attention item');

assert.deepEqual(items.find(({ id }) => id === 'i-partial'), {
  id: 'i-partial',
  documentType: 'invoice',
  documentId: 'i-partial',
  number: 'INV-PARTIAL',
  clientName: 'Partial Client',
  currency: 'USD',
  title: 'Remaining balance',
  action: 'openInvoices',
  actionLabel: 'Open invoice',
  paymentStatus: 'partial',
  amountPaidCents: 3000,
  amountDueCents: 9000,
  dueDate: '2026-09-12',
});

assert.equal(items.some(({ id }) => ['q-declined', 'q-converted', 'i-paid', 'i-draft'].includes(id)), false, 'terminal and draft documents must be excluded');
assert.deepEqual(sourceData, sourceSnapshot, 'derivation must not mutate authoritative read data');
assert.equal(items.every(({ action }) => ['openQuotes', 'openInvoices'].includes(action)), true, 'attention actions must only enter existing read-only document flows');

const stableOrder = buildNeedsAttention({
  quotes: [
    { id: 'q-z', quote_number: 'QT-Z', status: 'sent', updated_at: '2026-08-30T12:00:00Z' },
    { id: 'q-a', quote_number: 'QT-A', status: 'sent', updated_at: '2026-08-30T12:00:00Z' },
  ],
}, now);
assert.deepEqual(stableOrder.map(({ id }) => id), ['q-a', 'q-z'], 'same-class ties must use a stable deterministic tie-breaker');

const noAttention = buildNeedsAttention({
  quotes: [{ id: 'q-done', status: 'declined' }],
  invoices: [{ id: 'i-done', status: 'sent', payment_status: 'paid' }],
}, now);
assert.deepEqual(noAttention, []);

console.log('DASHBOARD_OVERVIEW_NEEDS_ATTENTION_R42_TEST=PASS');
