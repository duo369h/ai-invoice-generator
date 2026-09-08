import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const editorSource = readFileSync('src/components/dashboard/QuoteEditorProfessional.js', 'utf8');
const documentSource = readFileSync('src/components/dashboard/QuoteClientDocument.js', 'utf8');
const modelSource = readFileSync('src/components/dashboard/quoteEditorProfessionalModel.js', 'utf8');
const layoutSource = readFileSync('src/app/styles/layouts.css', 'utf8');

assert.match(modelSource, /PHOTOGRAPHY_ITEM_SUGGESTIONS/, 'Add Item must reuse the existing safe suggestion source');
assert.match(editorSource, /provisionalItemIndex/, 'Add Item must track a local provisional row');
assert.match(documentSource, /professional-add-item-suggestion-menu/, 'Suggestions must be anchored to the active Description cell');
assert.match(documentSource, /professional-add-suggestion-/, 'Suggested items must be selectable from the Description cell');
assert.match(documentSource, /quote-line-description-/, 'The provisional row must reuse the existing Description editor');
assert.doesNotMatch(`${editorSource}\n${documentSource}\n${layoutSource}`, /professional-add-item-surface|professional-add-item-custom-description|professional-add-item-custom-row|professional-add-item-cancel/, 'The separate authoring surface must be removed');
assert.doesNotMatch(`${documentSource}\n${layoutSource}`, />Suggested<|>Custom item<|>Type a description<|>Cancel<|>Add<\//, 'SaaS-form authoring labels must be absent from Add Item');
assert.match(editorSource, /onSuggestionSelect/, 'Suggestion selection must remain owned by the Quote editor');
assert.match(editorSource, /onExitAddItem/, 'Provisional row exit must remain owned by the Quote editor');
assert.match(layoutSource, /\.professional-add-item-suggestion-menu/, 'Compact Description suggestion styling must exist');
assert.match(layoutSource, /flex-direction:\s*column/, 'Suggestions must stack vertically');
assert.match(layoutSource, /max-height:/, 'Suggestion menu height must be bounded');
assert.match(layoutSource, /overflow-y:\s*auto/, 'Suggestion menu must support vertical scrolling');
assert.match(layoutSource, /overflow-x:\s*hidden/, 'Suggestion menu must suppress horizontal scrolling');
assert.match(documentSource, /Custom…/, 'Suggestion menu must make direct custom typing discoverable');
assert.match(documentSource, /onCustomSelect/, 'Custom discoverability must preserve the direct Description authoring path');
assert.doesNotMatch(layoutSource, /\.professional-add-item-suggestion-menu[\s\S]{0,700}flex-wrap:\s*wrap/, 'Suggestion menu must not use horizontal chip wrapping');
assert.match(`${editorSource}\n${documentSource}`, /non-printing[^\n]*professional-add-item|professional-add-item[^\n]*non-printing/, 'Add Item chrome must remain editor-only');

console.log('R56E-G-QE Add Item suggestion surface contract: PASS');
