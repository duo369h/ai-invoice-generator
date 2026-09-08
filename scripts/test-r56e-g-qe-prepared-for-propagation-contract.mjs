import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const documentSource = readFileSync('src/components/dashboard/QuoteClientDocument.js', 'utf8');
const editorSource = readFileSync('src/components/dashboard/QuoteEditorProfessional.js', 'utf8');
const layoutSource = readFileSync('src/app/styles/layouts.css', 'utf8');

assert.match(documentSource, /quote-client-document-prepared-for/, 'Prepared for needs a dedicated document target');
assert.match(documentSource, /preparedForActive/, 'Prepared for needs local active state input');
assert.match(documentSource, /data-testid="quote-prepared-for"/, 'Prepared for needs a focused browser target');
assert.match(editorSource, /activePreparedFor/, 'Professional editor needs local Prepared for active state');
assert.match(editorSource, /setActivePreparedFor\(false\)/, 'click outside must deactivate Prepared for');
assert.match(layoutSource, /quote-client-document-prepared-for:hover/, 'Prepared for needs a contextual hover affordance');
assert.doesNotMatch(documentSource, /onPointerDown=.*prepared/i, 'Prepared for must not activate on pointerdown');

console.log('R56E-G-QE-PREPARED-FOR propagation contract: PASS');
