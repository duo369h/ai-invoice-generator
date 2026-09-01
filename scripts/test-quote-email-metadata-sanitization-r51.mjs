import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { deserializeQuoteNotes } from '../src/components/dashboard/quoteNotes.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const emailPath = path.join(root, 'src/app/lib/email.js');

function loadEmailModule() {
  const source = fs.readFileSync(emailPath, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const moduleRecord = { exports };
  const requireMock = (specifier) => {
    if (specifier === './config') return { getSiteUrl: () => 'https://corvioz.example' };
    if (specifier.includes('quoteNotes.mjs')) return { deserializeQuoteNotes };
    if (specifier === 'resend') return { Resend: class {} };
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  new Function('exports', 'require', 'module', '__filename', '__dirname', code)(
    exports,
    requireMock,
    moduleRecord,
    emailPath,
    path.dirname(emailPath),
  );
  return moduleRecord.exports;
}

const { getQuoteSentEmailHtml } = loadEmailModule();
const metadata = {
  edit_count: 4,
  quote_preset_id: 'internal-preset-r51',
  quote_preset_name: 'Internal preset name',
  workflow_terms: ['internal workflow term'],
  comments: [{ body: 'internal comment r51' }],
  files: [{ name: 'internal-file-r51.pdf' }],
};

function quote(notes) {
  return {
    quote_number: 'QT-R51-001',
    client_name: 'Client',
    client_email: 'client@example.com',
    items: [],
    subtotal: 0,
    total: 0,
    currency: 'USD',
    notes,
  };
}

function render(notes) {
  return getQuoteSentEmailHtml(quote(notes), null, 'Photographer');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const publicAndMetadata = `Visible client note\n\n---METADATA---\n${JSON.stringify(metadata)}`;
const publicAndEncodedMetadata = `Visible encoded note\n\n---METADATA---\n${JSON.stringify(metadata)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/'/g, '&#39;')}`;

{
  const html = render(publicAndMetadata);
  assert.match(html, /Visible client note/);
  for (const internalValue of [
    '---METADATA---',
    'edit_count',
    'quote_preset_id',
    'quote_preset_name',
    'workflow_terms',
    'internal comment r51',
    'internal-file-r51.pdf',
  ]) {
    assert.equal(html.includes(internalValue), false, `Quote email must omit ${internalValue}`);
  }
}

{
  const html = render(`---METADATA---\n${JSON.stringify(metadata)}`);
  assert.equal(html.includes('Notes and terms'), false, 'metadata-only notes omit the client-facing block');
  assert.equal(html.includes('---METADATA---'), false);
}

{
  const plainNotes = 'Plain client note with no metadata';
  const html = render(plainNotes);
  assert.match(html, new RegExp(escapeHtml(plainNotes)));
  assert.match(html, /Notes and terms/);
}

{
  const unsafeNotes = '<script>alert(1)</script> & < >';
  const html = render(unsafeNotes);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; &lt; &gt;/);
  assert.equal(html.includes('<script>alert(1)</script>'), false);
}

{
  const html = render(publicAndEncodedMetadata);
  assert.match(html, /Visible encoded note/);
  assert.equal(html.includes('---METADATA---'), false);
  assert.equal(html.includes('internal comment r51'), false);
  assert.equal(html.includes('internal-file-r51.pdf'), false);
}

for (const storedNotes of [
  publicAndMetadata,
  publicAndEncodedMetadata,
  'Plain client note',
  '---METADATA---\n{"comments":[],"files":[]}',
]) {
  const expectedPublicNotes = deserializeQuoteNotes(storedNotes).notes;
  const html = render(storedNotes);
  if (expectedPublicNotes) {
    assert.match(html, new RegExp(escapeHtml(expectedPublicNotes)));
  } else {
    assert.equal(html.includes('Notes and terms'), false, 'empty canonical notes omit the client-facing block');
  }
}

{
  const malformed = 'Visible note\n\n---METADATA---\n{"comments":';
  const markerLike = 'Visible note ---METADATA---\n{"comments":[]}';
  assert.equal(
    deserializeQuoteNotes(malformed).notes,
    malformed,
    'malformed metadata follows the current canonical parser fallback'
  );
  assert.equal(
    deserializeQuoteNotes(markerLike).notes,
    markerLike,
    'marker-like text without a canonical delimiter remains an ordinary note'
  );
}

console.log('R51.2.1 Quote email metadata sanitization tests passed.');
