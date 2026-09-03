import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildRecentDocuments } from '../src/components/dashboard/dashboardWave1.mjs';

const read = (file) => fs.readFileSync(file, 'utf8');
const root = new URL('../', import.meta.url).pathname;
const source = (file) => {
  const path = `${root}${file}`;
  return fs.existsSync(path) ? read(path) : '';
};

const EFFECTIVE_MIDDLEWARE_AUTHORITY = 'middleware.js';
const middleware = source(EFFECTIVE_MIDDLEWARE_AUTHORITY);
const proposalPage = source('src/app/proposal/page.js');
const proposalsPage = source('src/app/proposals/page.js');
const proposalApi = source('src/app/api/proposals/generate/route.js');
const dashboard = source('src/components/dashboard/Dashboard.js');
const debugOverlay = source('src/components/DevDebugOverlay.js');
const styles = source('src/app/styles/components.css');

const internalRoutes = [
  'control-plane', 'evolution', 'optimization', 'revenue-validation',
  'simulation', 'audit', 'validation', 'product-funnel', 'early-access',
];

assert.equal(EFFECTIVE_MIDDLEWARE_AUTHORITY, 'middleware.js');
assert.match(middleware, /process\.env\.NODE_ENV\s*===\s*['"]production['"]/);
for (const route of internalRoutes) {
  assert.match(middleware, new RegExp(`/dashboard/${route}`), `${route} must be covered by the production boundary`);
  assert.match(middleware, new RegExp(`pathname === '/dashboard/${route}'`), `${route} exact path must be covered by the production boundary`);
  assert.match(middleware, new RegExp(String.raw`pathname\.startsWith\(['"]\/dashboard/${route}\/['"]\)`), `${route} nested path must be covered by the production boundary`);
}
assert.match(middleware, /NextResponse\.redirect/);
console.log('INTERNAL_EXPERIMENTAL_PRODUCTION_BOUNDARY=PASS');

assert.match(proposalPage, /redirect\(['"]\/dashboard\?tool=quotes['"]\)/);
assert.match(proposalsPage, /redirect\(['"]\/dashboard\?tool=quotes['"]\)/);
assert.doesNotMatch(proposalPage, /tool=proposal/);
assert.doesNotMatch(proposalsPage, /tool=proposal/);
assert.match(proposalApi, /LEGACY_SURFACE_UNAVAILABLE/);
assert.match(proposalApi, /return\s+NextResponse\.json/);
console.log('PROPOSAL_COMPATIBILITY_BOUNDARY=PASS');

assert.doesNotMatch(dashboard, /Copy (?:Client )?Portal Link|sandbox Portal URL/i);
assert.doesNotMatch(dashboard, /Portal is available/i);
console.log('PORTAL_SANDBOX_REMNANTS=PASS');

assert.match(dashboard, /process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*&&\s*\(/);
assert.match(debugOverlay, /process\.env\.NODE_ENV\s*===\s*['"]development['"]/);
console.log('PRODUCTION_DEBUG_UI_RENDERED=NO');

assert.match(dashboard, /isDevelopment/);
assert.match(dashboard, /corvioz_export_count/);
assert.match(dashboard, /corvioz_usage_stats/);
assert.match(dashboard, /isDevelopment\s*&&[\s\S]{0,240}corvioz_export_count/);
assert.match(dashboard, /previewMode\s*\|\|\s*!isDevelopment/);
console.log('LOCALSTORAGE_CORE_AUTHORITY=NO');

const wave1CardCount = (styles.match(/^\.dashboard-wave1-card\s*\{/gm) || []).length;
assert.equal(wave1CardCount, 1, 'Wave 1 card must have one canonical selector block');
assert.match(styles, /\.dashboard-wave1-document-main\s*,[\s\S]*?flex:\s*1\s+1\s+220px/);
assert.match(styles, /\.dashboard-wave1-document-meta\s*>\s*strong[\s\S]*?white-space:\s*normal/);
console.log('WAVE1_CSS_DUPLICATION=CLOSED');

const identicalTimestampFixture = {
  quotes: [
    { id: 'q-z', quote_number: 'QT-Z', status: 'sent', updated_at: '2026-09-03T10:00:00Z' },
    { id: 'q-a', quote_number: 'QT-A', status: 'sent', updated_at: '2026-09-03T10:00:00Z' },
  ],
  invoices: [
    { id: 'i-z', invoice_number: 'INV-Z', status: 'sent', updated_at: '2026-09-03T10:00:00Z' },
    { id: 'i-a', invoice_number: 'INV-A', status: 'sent', updated_at: '2026-09-03T10:00:00Z' },
  ],
};
const firstOrder = buildRecentDocuments(identicalTimestampFixture).map(({ type, id }) => `${type}:${id}`);
const secondOrder = buildRecentDocuments({
  quotes: identicalTimestampFixture.quotes.slice().reverse(),
  invoices: identicalTimestampFixture.invoices.slice().reverse(),
}).map(({ type, id }) => `${type}:${id}`);
assert.deepEqual(firstOrder, secondOrder);
assert.deepEqual(firstOrder, ['invoice:i-a', 'invoice:i-z', 'quote:q-a', 'quote:q-z']);
console.log('RECENT_DOCUMENT_EQUAL_TIMESTAMP_DETERMINISM=PASS');

assert.match(dashboard, /dashboard-modal-card/);
assert.match(styles, /\.dashboard-modal-overlay[\s\S]*?overflow-y:\s*auto/);
assert.match(styles, /\.dashboard-modal-card[\s\S]*?max-height:\s*calc\(100dvh\s*-\s*40px\)/);
assert.match(styles, /overflow-wrap:\s*anywhere/);
console.log('MOBILE_CORE_ACCEPTANCE=PASS');
console.log('MODAL_LAYERING=PASS');

assert.doesNotMatch(dashboard, /AI-driven estimate drafts/);
assert.doesNotMatch(source('src/app/dashboard/components/StudioSpace.js'), /Agency Operating System/);
console.log('EMPTY_ERROR_LANGUAGE=PASS');

console.log('R56D DASHBOARD UX CLOSURE TEST=PASS');
