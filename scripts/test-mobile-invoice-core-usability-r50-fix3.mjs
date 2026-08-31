import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const layouts = fs.readFileSync(path.join(root, 'src/app/styles/layouts.css'), 'utf8');

const mobileLayout = layouts.match(/@media \(max-width: 640px\) \{([\s\S]*?)\n\}/)?.[1] || '';
const narrowLayout = layouts.match(/@media \(max-width: 480px\) \{([\s\S]*?)\n\}/)?.[1] || '';

assert.match(dashboard, /className="dashboard-grid-2col invoice-editor-grid"/);
assert.match(dashboard, /className="invoice-summary-date-grid"/);

assert.match(mobileLayout, /\.invoice-editor-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
assert.match(mobileLayout, /\.invoice-editor-grid\s*>\s*\*[\s\S]*\.invoice-editor-grid\s+\.items-editor-row\s*\{[\s\S]*min-width:\s*0/);
assert.match(narrowLayout, /\.invoice-summary-date-grid\s*\{[\s\S]*grid-template-columns:\s*1fr/);

const responsiveContract = `${mobileLayout}\n${narrowLayout}`;
assert.doesNotMatch(responsiveContract, /overflow-x\s*:/, 'responsive invoice fix must not mask overflow');
assert.doesNotMatch(responsiveContract, /min-width\s*:\s*(?:max-content|\d+px)/, 'responsive invoice fix must not introduce fixed minimum widths');

for (const marker of [
  'isSelectedInvoiceSettled',
  'Read only · Recorded payment',
  'Continue to preview',
  'Save draft',
  'setInvClientId',
  'setInvQuoteId',
  'getInvoiceTimelineState',
  'setInvoiceFlowStage',
]) {
  assert.ok(dashboard.includes(marker), `preserved workflow marker missing: ${marker}`);
}

console.log('PASS: R50-004 responsive Invoice layout contract and workflow invariants');
