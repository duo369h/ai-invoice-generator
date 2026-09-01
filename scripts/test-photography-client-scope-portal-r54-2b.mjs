import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  projectPhotographyScopeFromQuoteNotes,
} from '../src/core/quotes/photographyQuoteScopePresentation.js';
import { serializeQuoteNotes } from '../src/components/dashboard/quoteNotes.mjs';

const routeSource = fs.readFileSync('src/app/api/portal/token/[token]/route.js', 'utf8');
const portalViewSource = fs.readFileSync('src/app/components/PortalClientView.js', 'utf8');

const persistedScope = {
  common: {
    shoot_type: 'Editorial',
    shoot_date: '2026-09-01',
    primary_location: 'Studio A',
    coverage_expectation: 'Full day',
    deliverables: ['RAW', 'JPEG'],
    final_image_count: 20,
    delivery_deadline: '2026-09-15',
    usage_rights: {
      status: 'specified',
      purpose: 'Campaign',
    },
  },
};

const storedQuoteNotes = serializeQuoteNotes('Public notes stay public', {
  photography_scope_v2: persistedScope,
  quote_preset_id: 'commercial-shoot',
  workflow_terms: ['internal only'],
  billing_type: 'standard',
  ai_recommendation: 'internal only',
  comments: [{ id: 'comment-1', author: 'Client', text: 'Please confirm timing.' }],
  files: [{ id: 'file-1', name: 'brief.pdf' }],
});

const projected = projectPhotographyScopeFromQuoteNotes(storedQuoteNotes);
assert.equal(projected.hasScope, true, 'persisted Quote Scope produces a client projection');
assert.deepEqual(projected.groups.map((group) => group.id), [
  'shoot',
  'coverage',
  'delivery',
  'usage_rights',
]);
assert.equal(JSON.stringify(projected).includes('photography_scope_v2'), false);
assert.equal(JSON.stringify(projected).includes('quote_preset_id'), false);
assert.equal(JSON.stringify(projected).includes('workflow_terms'), false);
assert.equal(JSON.stringify(projected).includes('billing_type'), false);
assert.equal(JSON.stringify(projected).includes('ai_recommendation'), false);
assert.equal(JSON.stringify(projected).includes('status'), false, 'usage rights status is excluded from the client model');

assert.match(routeSource, /projectPhotographyScopeFromQuoteNotes/);
assert.match(routeSource, /photography_scope:\s*projectPhotographyScopeFromQuoteNotes\(quote\.notes\)/);
assert.match(routeSource, /\.notes:\s*meta\.notes|notes:\s*meta\.notes/);
assert.match(routeSource, /comments:\s*meta\.comments/);
assert.match(routeSource, /files:\s*meta\.files/);
assert.doesNotMatch(routeSource, /photography_scope_v2\s*:/, 'raw metadata key is not a Portal payload property');
assert.match(routeSource, /function withInvoiceMeta[\s\S]*?payment_link/);
assert.doesNotMatch(
  routeSource.slice(routeSource.indexOf('function withInvoiceMeta'), routeSource.indexOf('function withQuoteMeta')),
  /photography_scope/,
  'Invoice Portal does not receive Photography Scope',
);

const quoteScopeStart = portalViewSource.indexOf('const photographyScope =');
const printableScopeStart = portalViewSource.indexOf('Scope', portalViewSource.indexOf('printable-sheet-grid'));
const itemsStart = portalViewSource.indexOf('Items Table');
assert.notEqual(quoteScopeStart, -1, 'Portal UI reads the server projection');
assert.match(portalViewSource, /photographyScope\?\.hasScope/);
assert.match(portalViewSource, /photographyScope\.groups/);
assert.ok(printableScopeStart > portalViewSource.indexOf('printable-sheet-grid'), 'Scope follows Quote identity and dates');
assert.ok(printableScopeStart < itemsStart, 'Scope appears before line items and pricing');
assert.match(portalViewSource, /docType === 'quote'/);
assert.match(portalViewSource, /<ul/);
assert.match(portalViewSource, /shoot_duration/);
assert.match(portalViewSource, /hr|min/);
assert.doesNotMatch(portalViewSource, /photography_scope_v2/);
assert.doesNotMatch(portalViewSource, /usage_rights\.status/);
assert.match(portalViewSource, /handleApproveQuote/);
assert.match(portalViewSource, /handleDeclineQuote/);
assert.match(portalViewSource, /Client Comments/);
assert.match(portalViewSource, /Print \/ Save PDF/);

console.log('R54.2B Portal Quote Scope contract test passed.');
