import assert from 'node:assert/strict';
import fs from 'node:fs';

const guided = fs.readFileSync(new URL('../src/components/dashboard/QuoteEditorGuided.js', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/components/dashboard/Dashboard.js', import.meta.url), 'utf8');

assert.match(guided, /reviewSaveRequired/, 'Guided Review must track whether its visible draft is explicitly saved');
assert.match(guided, /Save changes before sending/, 'edited or unsaved Review must explain why Send is unavailable');
assert.match(guided, /Add a valid email to send/, 'invalid email readiness must have truthful copy');
assert.match(guided, /Quote already sent/, 'sent Quotes must not use the missing-email copy');
assert.match(guided, /Only draft Quotes can be sent/, 'non-draft Quotes must have truthful readiness copy');
assert.match(guided, /reviewSaveRequired[\s\S]*?canSend|canSend[\s\S]*?reviewSaveRequired/, 'Send must remain blocked until the current draft is explicitly saved');
assert.match(guided, /className=\{`btn btn-(?:primary|secondary)[^}]*reviewSaveRequired|reviewSaveRequired[\s\S]*?btn btn-(?:primary|secondary)/, 'Review must make Save the dominant action when freshness is required');
assert.match(guided, /await actions\.save\(\)/, 'Guided Save must use the shared Save authority and observe completion');

assert.match(dashboard, /handleSaveQuote = async \(options\s*=\s*\{\}\)/, 'Save must expose a backward-compatible completion-aware options surface');
assert.match(dashboard, /surface\s*===\s*['"]guided['"]/, 'shared Save must identify Guided Review without creating a second persistence path');
assert.match(dashboard, /return true/, 'shared Save must return explicit success');
assert.match(dashboard, /return false/, 'shared Save must return explicit failure');
assert.match(dashboard, /save:\s*\(\)\s*=>\s*handleSaveQuote\(\{\s*surface:\s*['"]guided['"]\s*\}\)/, 'Guided Save action must call handleSaveQuote');
assert.match(dashboard, /send:\s*handleSendQuote/, 'Guided Send must retain the existing shared send authority');

console.log('R56E-G-QE-M06-FIX-1 review readiness contract: PASS');
