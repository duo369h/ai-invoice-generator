import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const model = await import('../src/components/dashboard/quoteEditorProfessionalModel.js');
const editorSource = readFileSync('src/components/dashboard/QuoteEditorProfessional.js', 'utf8');
const documentSource = readFileSync('src/components/dashboard/QuoteClientDocument.js', 'utf8');
const layoutSource = readFileSync('src/app/styles/layouts.css', 'utf8');

const items = [
  { description: 'A', quantity: 2, unitPrice: 100 },
  { description: 'B', quantity: 3, unitPrice: 200 },
  { description: 'C', quantity: 4, unitPrice: 300 },
];
const reordered = model.reorderQuoteItems(items, 2, 0, true);

assert.deepEqual(reordered.map((item) => item.description), ['C', 'A', 'B']);
assert.deepEqual(reordered.map((item) => [item.description, item.quantity, item.unitPrice]), [
  ['C', 4, 300],
  ['A', 2, 100],
  ['B', 3, 200],
], 'quantity and rate must stay attached to their description');
assert.deepEqual(items.map((item) => item.description), ['A', 'B', 'C'], 'reorder must not mutate the current draft array');

const sevenPlusItems = [
  { description: 'Retouching' },
  { description: 'Creative Fee' },
  { description: 'Photo Assistant' },
  { description: 'Equipment' },
  { description: 'Studio' },
  { description: 'Props' },
  { description: 'Travel' },
];
assert.deepEqual(
  model.derivePricingSections(sevenPlusItems).flatMap((section) => section.items).map((item) => item.description),
  sevenPlusItems.map((item) => item.description),
  'manual qItems order remains authoritative for seven-plus line items',
);

assert.equal(model.remapActiveItemIndex(2, 2, 0, true), 0, 'active dragged item follows its new position');
assert.equal(model.remapActiveItemIndex(1, 0, 2, false), 0, 'active item between source and destination shifts up');
assert.equal(model.remapActiveItemIndex(1, 2, 0, true), 2, 'active item between source and destination shifts down');
assert.equal(model.remapActiveItemIndex(null, 2, 0, true), null, 'no active row remains inactive');

assert.match(documentSource, /professional-row-drag-handle/);
assert.match(documentSource, /onDragStart/);
assert.match(documentSource, /onDrop/);
assert.match(editorSource, /setActiveItemIndex\(null\)/);
assert.match(editorSource, /document\.addEventListener\(['"]pointerdown['"]/);
assert.match(layoutSource, /\.professional-row-drag-handle/);

console.log('R56E-G-QE P0 line-item contract: PASS');
