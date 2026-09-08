import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const documentSource = readFileSync('src/components/dashboard/QuoteClientDocument.js', 'utf8');
const layoutSource = readFileSync('src/app/styles/layouts.css', 'utf8');
const unitSource = readFileSync('src/components/dashboard/quantityUnitOptions.mjs', 'utf8');

assert.match(documentSource, /QtyInteraction/, 'QTY must have a focused interaction component');
assert.match(documentSource, /onWheel/, 'engaged numeric QTY must own its wheel interaction');
assert.match(documentSource, /ArrowUp/, 'engaged numeric QTY must support ArrowUp');
assert.match(documentSource, /ArrowDown/, 'engaged numeric QTY must support ArrowDown');
assert.match(documentSource, /professional-qty-unit-menu/, 'unit choices must attach to the active factor');
assert.match(documentSource, /professional-qty-wheel-ghost/, 'wheel ghosts must be distinct from the editable center input');
assert.doesNotMatch(documentSource, /<strong>\{numericValue\}<\/strong>/, 'wheel must not render a second copy of the current value');
assert.match(documentSource, /getQuantityUnitOptions/, 'known photography items must use a contextual unit shortlist');
assert.match(documentSource, /professional-qty-add-factor/, 'secondary factor must be contextual');
assert.match(layoutSource, /professional-qty-affordance/, 'resting QTY must have a content-sized affordance');
assert.match(layoutSource, /professional-qty-wheel/, 'engaged QTY must have compact rolling feedback');
assert.match(layoutSource, /\.professional-qty-wheel \{[^}]*font-size:\s*inherit/, 'active wheel must inherit the resting QTY text size');
assert.match(layoutSource, /\.professional-qty-wheel-ghost \{[^}]*font-size:\s*0\.7em/, 'wheel ghosts must be approximately 70% of current value size');
assert.match(layoutSource, /\.professional-qty-wheel \.professional-qty-number \{[^}]*font-size:\s*1em[^}]*font-weight:\s*400/, 'current wheel value must retain normal document prominence');
assert.doesNotMatch(layoutSource, /\.professional-qty-affordance\s*\{[\s\S]{0,300}(?<!max-)width:\s*100%/, 'QTY affordance must not span the full cell');

assert.match(unitSource, /studio: \['day', 'hour', ''\]/, 'Studio shortlist is ordered by relevance');
assert.match(unitSource, /retouching: \['image', 'hour', 'day', ''\]/, 'Retouching shortlist is ordered by relevance');
assert.match(unitSource, /'photo assistant': \['person', 'day', 'hour', ''\]/, 'Photo Assistant shortlist is ordered by relevance');
assert.match(unitSource, /const GENERAL_UNIT_OPTIONS = \['', \.\.\.LINE_ITEM_BILLING_UNITS\]/, 'unknown items retain the general unit list');
assert.match(unitSource, /if \(expanded\) return GENERAL_UNIT_OPTIONS/, 'More expands to the complete unit set');

console.log('R56E-G-QE QTY interaction contract: PASS');
