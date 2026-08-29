import assert from 'node:assert/strict';
import {
  buildRecentDocuments,
  getDashboardQuickActions,
  getDashboardSurfaceState,
  getDashboardTabForTool,
} from '../src/components/dashboard/dashboardWave1.mjs';

assert.equal(getDashboardTabForTool(null), 'overview', 'plain /dashboard must open Overview');
assert.equal(getDashboardTabForTool('quote'), 'quotes', 'quote navigation must remain direct');
assert.equal(getDashboardTabForTool('invoice'), 'invoices', 'invoice navigation must remain direct');

const actions = getDashboardQuickActions();
assert.deepEqual(actions.map(({ id, label }) => ({ id, label })), [
  { id: 'createQuote', label: 'Create Quote' },
  { id: 'createInvoice', label: 'Create Invoice' },
]);

const recent = buildRecentDocuments({
  quotes: [{ id: 'q-1', quote_number: 'QT-1', client_name: 'Quote Client', total: 12500, status: 'sent', created_at: '2026-08-28T09:00:00Z' }],
  invoices: [{ id: 'i-1', invoice_number: 'INV-1', client_name: 'Invoice Client', total: 9900, payment_status: 'paid', created_at: '2026-08-29T09:00:00Z' }],
});
assert.deepEqual(recent.map(({ type, number, clientName, status }) => ({ type, number, clientName, status })), [
  { type: 'invoice', number: 'INV-1', clientName: 'Invoice Client', status: 'paid' },
  { type: 'quote', number: 'QT-1', clientName: 'Quote Client', status: 'sent' },
]);
assert.equal(recent[0].total, 9900, 'recent document total must remain in source cents');

assert.equal(getDashboardSurfaceState({ isLoading: true, quotes: [], invoices: [] }), 'loading');
assert.equal(getDashboardSurfaceState({ isLoading: true, quotes: [{ id: 'q-1' }], invoices: [] }), 'ready', 'refreshing data must not hide existing documents');
assert.equal(getDashboardSurfaceState({ error: 'documents unavailable', quotes: [], invoices: [] }), 'error');
assert.equal(getDashboardSurfaceState({ quotes: [], invoices: [] }), 'empty');
assert.equal(getDashboardSurfaceState({ quotes: [{ id: 'q-1' }], invoices: [] }), 'ready');

console.log('DASHBOARD_COMPLETION_WAVE1_TEST=PASS');
