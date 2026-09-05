import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { calculateQuoteTotals } from '../src/components/dashboard/quoteTotals.js';

const baseSha = '140c8c77f7ea5d471275b6297f8ac8382c63b8df';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const documentPath = 'src/components/dashboard/QuoteClientDocument.js';
const previewFramePath = 'src/components/dashboard/QuoteClientDocumentPreviewFrame.js';
const totalsPath = 'src/components/dashboard/quoteTotals.js';
const layoutPath = 'src/app/styles/layouts.css';
const dashboardSource = readFileSync(dashboardPath, 'utf8');
const changedFiles = execFileSync('git', ['diff', '--name-only', baseSha, '--'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
const changedSourceFiles = changedFiles.filter((file) => file.startsWith('src/') || file.startsWith('scripts/'));
const allowedSourceFiles = new Set([
  dashboardPath,
  documentPath,
  previewFramePath,
  totalsPath,
  layoutPath,
  'scripts/test-r56e-s4b-quote-editor-client-document.mjs',
  'scripts/test-r56e-s4b-browser-runtime.mjs',
]);

assert.ok(changedSourceFiles.every((file) => allowedSourceFiles.has(file)), `S4B source scope contains unauthorized files: ${changedSourceFiles.filter((file) => !allowedSourceFiles.has(file)).join(', ')}`);

assert.equal(existsSync(documentPath), true, 'shared QuoteClientDocument module must exist');
assert.equal(existsSync(previewFramePath), true, 'focused document preview frame must exist');
assert.equal(existsSync(totalsPath), true, 'shared Quote totals helper must exist');
const documentSource = readFileSync(documentPath, 'utf8');
const previewFrameSource = readFileSync(previewFramePath, 'utf8');
const totalsSource = readFileSync(totalsPath, 'utf8');
const layoutSource = readFileSync(layoutPath, 'utf8');

assert.match(dashboardSource, /QuoteClientDocument/);
assert.match(dashboardSource, /calculateQuoteTotals/);
assert.match(dashboardSource, /QuoteClientDocumentPreviewFrame/);
assert.match(dashboardSource, /<QuoteClientDocumentPreviewFrame>/);
assert.match(documentSource, /export default function QuoteClientDocument/);
assert.match(previewFrameSource, /export default function QuoteClientDocumentPreviewFrame/);
assert.match(previewFrameSource, /ResizeObserver/);
assert.match(previewFrameSource, /transform:\s*`scale\(/);
assert.match(previewFrameSource, /794/);
assert.match(totalsSource, /export function calculateQuoteTotals/);
assert.equal((dashboardSource.match(/<QuoteClientDocument\b/g) || []).length, 2, 'screen and PDF must be two instances of one renderer');
assert.match(dashboardSource, /id="printable-quote"[\s\S]*<QuoteClientDocument\b/);
assert.match(dashboardSource, /data-testid="quote-client-document-canvas"[\s\S]*<QuoteClientDocument\b/);
assert.match(documentSource, /width: '794px'/);
assert.match(dashboardSource, /quoteWorkspaceMode/);
assert.match(dashboardSource, /Edit/);
assert.match(dashboardSource, /Preview/);
assert.match(layoutSource, /grid-template-columns:\s*minmax\(420px, 480px\) minmax\(0, 1fr\)/);
assert.match(layoutSource, /max-width: 1179px/);
assert.match(layoutSource, /data-workspace-mode="edit"/);
assert.match(layoutSource, /data-workspace-mode="preview"/);
assert.match(totalsSource, /discountedSubtotal/);
assert.match(totalsSource, /total: discountedSubtotal \+ tax/);
assert.deepEqual(
  calculateQuoteTotals([{ quantity: 2, unitPrice: 100 }, { quantity: 1, unitPrice: 50 }], 10, 13),
  { subtotal: 250, discount: 25, discountedSubtotal: 225, tax: 29.25, total: 254.25 },
  'shared totals helper must preserve current subtotal, discount, tax, and total semantics',
);

const sectionIds = [
  'quote-workspace-context',
  'quote-workspace-scope',
  'quote-workspace-usage',
  'quote-workspace-pricing',
  'quote-workspace-terms',
  'quote-workspace-review',
];
const sectionPositions = sectionIds.map((id) => dashboardSource.indexOf(`id="${id}"`));
assert.ok(sectionPositions.every((position) => position >= 0), 'all S4B Quote sections must remain present');
assert.deepEqual([...sectionPositions].sort((left, right) => left - right), sectionPositions, 'S4A sections must remain ordered');
assert.match(dashboardSource, /Usage Rights/);
assert.match(dashboardSource, /Save Quote/);
assert.match(dashboardSource, /Send Quote/);
assert.match(dashboardSource, /Review with Corvioz/);
assert.match(dashboardSource, /data-dashboard-date-entry="english"/);
assert.match(dashboardSource, /data-testid="quote-date-input"[\s\S]*placeholder="YYYY-MM-DD"/);
assert.doesNotMatch(dashboardSource, /className="[^"]*quote-workspace-production/);
assert.doesNotMatch(dashboardSource, />Project</);
assert.doesNotMatch(dashboardSource, />Portal</);
assert.doesNotMatch(dashboardSource, /AI Price|Market Price|Generate Price/);
assert.doesNotMatch(documentSource, /(^|[>'"])\s*\$\s*(?:\{|\d)/, 'client document must use the shared currency formatter');

assert.equal(execFileSync('git', ['diff', '--name-only', baseSha, '--', 'supabase', 'src/app/api'], { encoding: 'utf8' }).trim(), '', 'S4B must not change database or API paths');

console.log('R56E-F-S4B Quote Client Document Contract: PASS');
