import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const editorPath = 'src/components/dashboard/QuoteEditorProfessional.js';
const modelPath = 'src/components/dashboard/quoteEditorProfessionalModel.js';
const documentPath = 'src/components/dashboard/QuoteClientDocument.js';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const layoutPath = 'src/app/styles/layouts.css';

assert.equal(existsSync(editorPath), true, 'professional desktop Quote Editor component must exist');
assert.equal(existsSync(modelPath), true, 'professional Quote document model must exist');

const [{
  A4_DOCUMENT_HEIGHT,
  A4_DOCUMENT_WIDTH,
  buildQuoteDraftFingerprint,
  derivePricingSections,
  paginateQuoteItems,
  resolveDesktopQuoteAction,
}] = await Promise.all([import(`../${modelPath}`)]);

assert.equal(A4_DOCUMENT_WIDTH, 794, 'A4 editor/PDF width authority remains 794px');
assert.equal(A4_DOCUMENT_HEIGHT, 1123, 'A4 editor/PDF height authority remains 1123px');
assert.equal(paginateQuoteItems(Array.from({ length: 11 }, (_, index) => ({ description: `Item ${index}` }))).length, 1, 'eleven-item production Quote remains one finite A4 page');
assert.equal(paginateQuoteItems(Array.from({ length: 22 }, (_, index) => ({ description: `Item ${index}` }))).length, 2, 'dense Quote creates a second physical page');

const sections = derivePricingSections([
  { description: 'Photography / Creative Fee' },
  { description: 'Photo Assistant' },
  { description: 'Equipment / Lighting' },
  { description: 'Studio / Location' },
  { description: 'Props' },
  { description: 'Styling' },
  { description: 'Retouching' },
  { description: 'Travel / Expenses' },
  { description: 'Production Fee' },
]);
assert.deepEqual(sections.map((section) => section.label), [null], 'manual line-item order is authoritative; implicit keyword regrouping is superseded');
assert.deepEqual(sections[0].items.map((item) => item.description), [
  'Photography / Creative Fee',
  'Photo Assistant',
  'Equipment / Lighting',
  'Studio / Location',
  'Props',
  'Styling',
  'Retouching',
  'Travel / Expenses',
  'Production Fee',
], 'manual line-item order remains unchanged by section derivation');

const baseQuote = { qId: 'quote-1', qNumber: 'QT-M06', qClientName: 'Client', qClientEmail: 'client@example.com', qClientAddress: '', qItems: [{ description: 'Photography', quantity: 1, unitPrice: 1200 }], qTaxRate: 0, qDiscountRate: 0, qCurrency: 'USD', qNotes: '', qDate: '2026-09-06', qPhotographyScope: {} };
assert.equal(buildQuoteDraftFingerprint(baseQuote), buildQuoteDraftFingerprint({ ...baseQuote, selectedQuotePresetId: 'wedding-shoot' }), 'template selection without Quote data mutation does not mark the Quote dirty');
assert.notEqual(buildQuoteDraftFingerprint(baseQuote), buildQuoteDraftFingerprint({ ...baseQuote, qItems: [{ description: 'Photography', quantity: 1, unitPrice: 1500 }] }), 'pricing mutation marks the Quote dirty');
assert.deepEqual(resolveDesktopQuoteAction({ hasSavedQuote: false, isDirty: true, status: 'draft' }), { statusLabel: 'Unsaved changes', action: 'save', actionLabel: 'Save' });
assert.deepEqual(resolveDesktopQuoteAction({ hasSavedQuote: true, isDirty: false, status: 'draft' }), { statusLabel: 'Saved', action: 'send', actionLabel: 'Send Quote' });
assert.deepEqual(resolveDesktopQuoteAction({ hasSavedQuote: true, isDirty: true, status: 'draft' }), { statusLabel: 'Unsaved changes', action: 'save', actionLabel: 'Save' });

const editorSource = readFileSync(editorPath, 'utf8');
const documentSource = readFileSync(documentPath, 'utf8');
const dashboardSource = readFileSync(dashboardPath, 'utf8');
const layoutSource = readFileSync(layoutPath, 'utf8');

for (const label of ['Commercial', 'Wedding', 'Portrait', 'Event', 'Product', 'Food', 'Architecture']) {
  assert.match(editorSource, new RegExp(`['\"]${label}['\"]`), `${label} paper index remains visible`);
}
for (const testId of [
  'professional-quote-editor',
  'professional-pricing-row-',
  'professional-add-item',
  'professional-intelligence',
  'professional-usage-summary',
  'professional-floating-sheet',
]) {
  assert.match(`${editorSource}\n${documentSource}`, new RegExp(testId), `${testId} contract must exist`);
}

assert.match(dashboardSource, /QuoteEditorProfessional/);
assert.match(dashboardSource, /Quote Create \/ Edit View[\s\S]*?<QuotePresentationBoundary\b[\s\S]*?<QuoteEditorProfessional\b[^>]*\/>/, 'desktop Quote Editor remains rendered inside the presentation boundary');
assert.match(documentSource, /quote-client-document-page/);
assert.match(documentSource, /data-page-ratio="210:297"/);
assert.match(layoutSource, /@media \(min-width: 1024px\)/);
assert.match(layoutSource, /@media \(max-width: 1023px\)/);
assert.match(layoutSource, /\.professional-floating-sheet/);
assert.match(layoutSource, /\.professional-document-field/);
assert.match(layoutSource, /\.professional-add-item/);
assert.match(layoutSource, /\.professional-intelligence-annotation/);
assert.doesNotMatch(editorSource, /autosave/i);
assert.doesNotMatch(editorSource, /Production House mode/i);

console.log('R56E-G-QE-PRO-IMPL-01 contract: PASS');
