import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const guided = read('src/components/dashboard/QuoteEditorGuided.js');
const boundary = read('src/components/dashboard/QuotePresentationBoundary.js');
const dashboard = read('src/components/dashboard/Dashboard.js');
const layouts = read('src/app/styles/layouts.css');

assert.match(guided, /data-testid="quote-guided-review-step"/);
assert.match(guided, /data-guided-step="REVIEW"/);
for (const label of ['Client', 'Scope \/ Deliverables', 'Pricing', 'Usage', 'Terms \/ Notes']) {
  assert.match(guided, new RegExp(label));
}
for (const testId of [
  'quote-guided-review-attention',
  'quote-guided-review-preview',
  'quote-guided-review-save',
  'quote-guided-review-send',
  'quote-guided-review-pdf',
]) assert.match(guided, new RegExp(testId));

assert.match(guided, /QuoteClientDocument/);
assert.match(guided, /QuoteClientDocumentPreviewFrame/);
assert.match(guided, /mobilePreviewOpen/);
assert.match(guided, /actions\.save/);
assert.match(guided, /actions\.send/);
assert.match(guided, /actions\.exportPdf/);
assert.match(guided, /derived\.reviewFindings/);
assert.match(guided, /derived\.reviewStatus/);
assert.doesNotMatch(guided, /COMPATIBILITY_DETAILS|quote-guided-compatibility|compatibilityPresentation/);
assert.doesNotMatch(guided, /fetch\(|autosave|auto-save|autoSave/i);
assert.doesNotMatch(guided, /quote_provenance_v1|raw_client_source|original_scope_baseline|machine_draft/);

assert.doesNotMatch(boundary, /compatibilityPresentation/);
assert.match(boundary, /QuoteEditorGuided/);
assert.match(boundary, /mode === 'GUIDED'/);

assert.match(dashboard, /reviewFindings/);
assert.match(dashboard, /reviewStatus/);
assert.match(dashboard, /canExportPdf/);
assert.match(dashboard, /hasCleanPdf/);
assert.match(layouts, /quote-guided-review/);

console.log('R56E-G-QE-M06 Review contract: PASS');
