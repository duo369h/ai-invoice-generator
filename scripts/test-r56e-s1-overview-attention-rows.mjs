import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildNeedsAttention, buildRecentDocuments } from '../src/components/dashboard/dashboardWave1.mjs';

const overview = fs.readFileSync('src/app/dashboard/components/DashboardOverview.js', 'utf8');

const fixture = {
  quotes: [
    { id: 'quote-draft', quote_number: 'QT-DRAFT', client_name: 'Draft Client', status: 'draft', updated_at: '2026-09-03T10:00:00Z' },
    { id: 'quote-approved', quote_number: 'QT-APPROVED', client_name: 'Approved Client', status: 'approved', updated_at: '2026-09-03T09:00:00Z' },
    { id: 'quote-recent', quote_number: 'QT-RECENT', client_name: 'Recent Quote Client', status: 'declined', updated_at: '2026-09-03T08:00:00Z', total: 12500, currency: 'USD' },
  ],
  invoices: [
    { id: 'invoice-overdue', invoice_number: 'INV-OVERDUE', client_name: 'Overdue Client', status: 'sent', payment_status: 'unpaid', due_date: '2026-08-01', amount_due_cents: 24000, currency: 'EUR', updated_at: '2026-09-03T07:00:00Z' },
    { id: 'invoice-partial', invoice_number: 'INV-PARTIAL', client_name: 'Partial Client', status: 'sent', payment_status: 'partial', amount_paid_cents: 10000, amount_due_cents: 14000, currency: 'USD', updated_at: '2026-09-03T06:00:00Z' },
    { id: 'invoice-recent', invoice_number: 'INV-RECENT', client_name: 'Recent Invoice Client', status: 'paid', payment_status: 'paid', total: 34000, currency: 'GBP', updated_at: '2026-09-03T05:00:00Z' },
  ],
};

const attention = buildNeedsAttention(fixture);
assert.deepEqual(
  attention.map(({ id, action, documentId, documentType }) => ({ id, action, documentId, documentType })),
  [
    { id: 'invoice-overdue', action: 'openInvoices', documentId: 'invoice-overdue', documentType: 'invoice' },
    { id: 'invoice-partial', action: 'openInvoices', documentId: 'invoice-partial', documentType: 'invoice' },
    { id: 'quote-approved', action: 'createInvoiceFromQuote', documentId: 'quote-approved', documentType: 'quote' },
    { id: 'quote-draft', action: 'openQuotes', documentId: 'quote-draft', documentType: 'quote' },
  ],
  'Needs Attention remains a deterministic Quote/Invoice projection',
);

const recent = buildRecentDocuments(fixture);
assert.deepEqual(
  recent.map(({ type, id }) => ({ type, id })),
  [
    { type: 'quote', id: 'quote-draft' },
    { type: 'quote', id: 'quote-approved' },
    { type: 'quote', id: 'quote-recent' },
    { type: 'invoice', id: 'invoice-overdue' },
    { type: 'invoice', id: 'invoice-partial' },
    { type: 'invoice', id: 'invoice-recent' },
  ],
  'Recent Documents remains deterministic and preserves canonical IDs',
);

assert.match(
  overview,
  /<button[\s\S]*?className="dashboard-needs-attention-item"[\s\S]*?aria-label=\{item\.actionLabel\}[\s\S]*?onClick=\{\(\) => resolveAction\(actionHandlers, item\.action, \{ id: item\.documentId, documentType: item\.documentType \}\)\}/,
  'Needs Attention uses a semantic row control with the existing exact payload',
);
assert.match(
  overview,
  /<button[\s\S]*?className="dashboard-wave1-document"[\s\S]*?aria-label=\{`Open \$\{typeLabel\}`\}[\s\S]*?onClick=\{\(\) => resolveAction\(actionHandlers, openAction, \{ id: document\.id, documentType: isQuote \? 'quote' : 'invoice' \}\)\}/,
  'Recent Documents uses a semantic row control with the existing exact payload',
);
assert.doesNotMatch(overview, /<article className="dashboard-needs-attention-item"/, 'Needs Attention must not use a non-interactive article row');
assert.doesNotMatch(overview, /<article className="dashboard-wave1-document"/, 'Recent Documents must not use a non-interactive article row');

const needsRow = overview.slice(overview.indexOf('<button\n                type="button"\n                className="dashboard-needs-attention-item"'), overview.indexOf('</button>', overview.indexOf('className="dashboard-needs-attention-item"')) + '</button>'.length);
const recentRow = overview.slice(overview.indexOf('<button\n                  type="button"\n                  className="dashboard-wave1-document"'), overview.indexOf('</button>', overview.indexOf('className="dashboard-wave1-document"')) + '</button>'.length);
assert.equal((needsRow.match(/<button/g) || []).length, 1, 'Needs Attention row must not contain a nested button');
assert.equal((recentRow.match(/<button/g) || []).length, 1, 'Recent Documents row must not contain a nested button');

assert.match(overview, /data-testid=\{`needs-attention-\$\{needsAttentionState\.mode\}-state`\}/, 'Needs Attention keeps distinct mode state branches');
assert.match(overview, /needsAttentionState\.mode === 'stale'/, 'Needs Attention keeps stale disclosure');
for (const branch of ['dashboard-loading-state', 'dashboard-error-state', 'dashboard-empty-state']) {
  assert.match(overview, new RegExp(branch), `${branch} remains present`);
}

assert.match(overview, /Some data could not be refreshed\. Showing the latest available documents\./);
assert.match(overview, /Due \{formatAttentionDate\(item\.dueDate\)\}/);
assert.match(overview, /Remaining \{formatAttentionAmount\(item\.amountDueCents, item\.currency\)\}/);
assert.match(overview, /Paid \{formatAttentionAmount\(item\.amountPaidCents, item\.currency\)\}/);
assert.match(overview, /document\.type === 'quote'/);
assert.match(overview, /const openAction = isQuote \? 'openQuotes' : 'openInvoices'/);

console.log('R56E-S1 OVERVIEW ATTENTION ROWS TEST=PASS');
