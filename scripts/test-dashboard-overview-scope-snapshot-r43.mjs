import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildScopeSnapshot,
  getScopeSnapshotSurfaceState,
  selectLatestQuote,
} from '../src/components/dashboard/dashboardWave1.mjs';

const quotes = [
  {
    id: 'q-old',
    quote_number: 'QT-OLD',
    status: 'draft',
    client_name: 'Older Client',
    total: 100,
    currency: 'USD',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z',
  },
  {
    id: 'q-latest',
    quote_number: 'QT-LATEST',
    status: 'sent',
    client_name: 'Long Client Name',
    total: 987654,
    currency: 'EUR',
    notes: 'Free-form scope note.',
    items: [
      { description: 'Location photography', quantity: 2, unit_price: 1200, amount: 2400 },
      { description: 'Portrait retouching', quantity: 3, unit_price: 500, amount: 1500 },
      { description: 'Web usage license', quantity: 1, unit_price: 800, amount: 800 },
      { description: 'Archive delivery', quantity: 4, unit_price: 100, amount: 400 },
      { description: 'Fifth authoritative item', quantity: 9, unit_price: 1, amount: 9 },
      { description: 'Sixth authoritative item', quantity: 10, unit_price: 1, amount: 10 },
    ],
    created_at: '2026-08-03T10:00:00Z',
    updated_at: '2026-08-04T10:00:00Z',
  },
];

assert.equal(selectLatestQuote(quotes).id, 'q-latest', 'latest updated Quote must be selected');

assert.equal(
  selectLatestQuote([
    { id: 'q-created-latest', created_at: '2026-08-05T10:00:00Z' },
    { id: 'q-created-old', created_at: '2026-08-04T10:00:00Z' },
  ]).id,
  'q-created-latest',
  'created_at must be the fallback ordering field',
);

assert.equal(
  selectLatestQuote([
    { id: 'q-z', quote_number: 'QT-Z', updated_at: '2026-08-06T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
    { id: 'q-a', quote_number: 'QT-A', updated_at: '2026-08-06T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  ]).id,
  'q-a',
  'stable quote id tie-break must be deterministic',
);

const sourceSnapshot = structuredClone(quotes);
const snapshot = buildScopeSnapshot(quotes);
assert.deepEqual(quotes, sourceSnapshot, 'selection and projection must not mutate source data');
assert.equal(snapshot.id, 'q-latest');
assert.equal(snapshot.quoteNumber, 'QT-LATEST', 'Quote number must be preserved');
assert.equal(snapshot.status, 'sent', 'Quote status must be preserved');
assert.equal(snapshot.clientName, 'Long Client Name', 'client snapshot must be preserved');
assert.equal(snapshot.total, 987654, 'stored total must be used without recalculation');
assert.equal(snapshot.currency, 'EUR', 'stored currency must be preserved');
assert.equal(snapshot.notes, 'Free-form scope note.');
assert.equal(snapshot.updatedAt, '2026-08-04T10:00:00Z');
assert.deepEqual(snapshot.items.map(({ description, quantity }) => ({ description, quantity })), [
  { description: 'Location photography', quantity: 2 },
  { description: 'Portrait retouching', quantity: 3 },
  { description: 'Web usage license', quantity: 1 },
  { description: 'Archive delivery', quantity: 4 },
], 'line item descriptions and quantity must remain authoritative');
assert.equal(snapshot.moreItemCount, 2, 'remaining item count must be accurate');
assert.equal(snapshot.items.length, 4, 'Scope Snapshot may display at most four line items');

const missingCurrency = buildScopeSnapshot([{ id: 'q-missing-currency', total: 12345, currency: null }]);
assert.equal(missingCurrency.currency, null, 'missing currency must remain missing');
assert.equal(buildScopeSnapshot([{ id: 'q-empty-currency', total: 12345, currency: '' }]).currency, null, 'empty currency must remain missing');

assert.equal(
  selectLatestQuote([
    { id: 'q-older-updated', updated_at: '2026-08-01T10:00:00Z', created_at: '2026-07-01T10:00:00Z' },
    { id: 'q-newer-created-only', created_at: '2026-08-02T10:00:00Z' },
  ]).id,
  'q-newer-created-only',
  'newer created-only quote must beat an older quote with updated_at',
);
assert.equal(
  selectLatestQuote([
    { id: 'q-invalid-updated', updated_at: 'not-a-date', created_at: '2026-08-05T10:00:00Z' },
    { id: 'q-valid-older-updated', updated_at: '2026-08-04T10:00:00Z', created_at: '2026-08-01T10:00:00Z' },
  ]).id,
  'q-invalid-updated',
  'invalid updated_at must fall back to valid created_at',
);
assert.equal(
  buildScopeSnapshot([{ id: 'q-invalid-display', updated_at: 'not-a-date', created_at: '2026-08-05T10:00:00Z' }]).updatedAt,
  '2026-08-05T10:00:00Z',
  'snapshot timestamp must use valid created_at when updated_at is invalid',
);

const emptyItems = buildScopeSnapshot([{ id: 'q-empty', items: [], total: 4321, currency: 'USD' }]);
assert.deepEqual(emptyItems.items, []);
assert.equal(emptyItems.moreItemCount, 0);
assert.equal(emptyItems.hasItems, false, 'empty items must remain an honest empty scope');
assert.equal(buildScopeSnapshot([{ id: 'q-no-notes', items: [{ description: 'One' }] }]).notes, null, 'notes are optional');

assert.equal(getScopeSnapshotSurfaceState({ isLoading: true, quotes: [] }).mode, 'loading');
assert.notEqual(getScopeSnapshotSurfaceState({ isLoading: true, quotes: [] }).title, 'Create a quote to see a scope snapshot here.');
assert.equal(getScopeSnapshotSurfaceState({ error: new Error('failed'), quotes: [] }).mode, 'error');
assert.equal(getScopeSnapshotSurfaceState({ quotes: [] }).mode, 'empty');
assert.equal(getScopeSnapshotSurfaceState({ error: new Error('refresh failed'), quotes }).mode, 'stale');
assert.equal(getScopeSnapshotSurfaceState({ quotes }).mode, 'ready');

const overview = readFileSync(new URL('../src/app/dashboard/components/DashboardOverview.js', import.meta.url), 'utf8');
const scopeSection = overview.match(/function Wave1ScopeSnapshot[\s\S]*?(?=function Wave1RecentDocuments)/)?.[0] || '';
assert.match(scopeSection, /Scope Snapshot/);
assert.match(scopeSection, /Latest quote[\s\S]*Quote scope only/);
assert.match(scopeSection, /openQuotes/);
assert.match(scopeSection, /Currency unavailable/);
assert.doesNotMatch(scopeSection, /Job|Project|Shoot|Booking|invoice|payment|fetch\(|POST|PATCH|DELETE/);
assert.match(overview, /<Wave1QuickActions[\s\S]*<Wave1NeedsAttention[\s\S]*<Wave1ScopeSnapshot[\s\S]*<Wave1RecentDocuments/);

console.log('DASHBOARD_OVERVIEW_SCOPE_SNAPSHOT_R43_TEST=PASS');
