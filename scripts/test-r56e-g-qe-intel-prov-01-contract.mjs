import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { buildQuoteProvenanceForSave, createLeadQuoteProvenance, isRecognizedRawClientSource } from '../src/core/quotes/quoteProvenance.js';
import { deserializeQuoteNotes, serializeQuoteNotes, validateSerializedQuoteNotes } from '../src/components/dashboard/quoteNotes.mjs';
import { normalizePhotographyScope } from '../src/core/quotes/photographyQuoteScope.js';

const scope = (name) => normalizePhotographyScope({ common: { shoot_type: name, usage_rights: { status: 'specified', purpose: name } } });
const scopeA = scope('A');
const scopeB = scope('B');
const lead = createLeadQuoteProvenance('lead-real-01');

assert.deepEqual(lead.raw_client_source, { kind: 'lead_message', lead_id: 'lead-real-01', source_field: 'message' });
assert.deepEqual(lead.machine_draft, { source: 'quotes_generate', authority: 'suggestion_only' });
assert.equal(lead.canonical_authority, undefined);
assert.equal(isRecognizedRawClientSource(lead.raw_client_source), true);

const firstSave = buildQuoteProvenanceForSave({ draftProvenance: lead, currentScope: scopeA });
assert.deepEqual(firstSave.original_scope_baseline, scopeA);
assert.deepEqual(firstSave.canonical_authority, { authority: 'photographer', confirmation_action: 'explicit_quote_save' });

const laterSave = buildQuoteProvenanceForSave({
  existingProvenance: firstSave,
  draftProvenance: { raw_client_source: { kind: 'lead_message', lead_id: 'lead-other', source_field: 'message' }, canonical_authority: { authority: 'client' } },
  existingScope: scopeA,
  currentScope: scopeB,
});
assert.deepEqual(laterSave.original_scope_baseline, scopeA);
assert.equal(laterSave.raw_client_source.lead_id, 'lead-real-01');
assert.deepEqual(laterSave.canonical_authority, { authority: 'photographer', confirmation_action: 'explicit_quote_save' });

const legacySave = buildQuoteProvenanceForSave({ existingScope: scopeA, currentScope: scopeB });
assert.deepEqual(legacySave.original_scope_baseline, scopeA);
const manualSave = buildQuoteProvenanceForSave({ currentScope: scopeA });
assert.equal(manualSave.raw_client_source, undefined);
assert.equal(manualSave.machine_draft, undefined);

const stored = serializeQuoteNotes('Public note', { photography_scope_v2: scopeB, quote_provenance_v1: laterSave, comments: ['keep'] });
assert.deepEqual(deserializeQuoteNotes(validateSerializedQuoteNotes(stored)).metadata.quote_provenance_v1, laterSave);
assert.equal(deserializeQuoteNotes(validateSerializedQuoteNotes('x'.repeat(5000))).notes.length, 4000);
assert.throws(() => validateSerializedQuoteNotes(serializeQuoteNotes('Public', { oversized: 'x'.repeat(20000) })), /metadata/i);
assert.equal(deserializeQuoteNotes('Legacy note').notes, 'Legacy note');
assert.equal(deserializeQuoteNotes('Broken\n\n---METADATA---\n{"oops":').notes.includes('---METADATA---'), true);

const generateRoutePath = path.resolve('src/app/api/quotes/generate/route.js');
const generateSource = fs.readFileSync(generateRoutePath, 'utf8');
assert.doesNotMatch(generateSource, /getDecision|pricing_bias|injectQuoteDecision|AI_DECISION_CORE/);
assert.match(generateSource, /unitPrice:\s*0/);
const generateCode = ts.transpileModule(generateSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const generateExports = {};
const generateModule = { exports: generateExports };
const nextResponse = { json: (body, init = {}) => ({ status: init.status || 200, body }) };
new Function('exports', 'require', 'module', '__filename', '__dirname', generateCode)(
  generateExports,
  (specifier) => {
    if (specifier.includes('next/server')) return { NextResponse: nextResponse };
    if (specifier.includes('lib/supabase')) return { getRequestUser: async () => ({ mode: 'supabase', user: { id: 'user-1' } }) };
    if (specifier.includes('rate-limit')) return { rateLimitAuthenticated: async () => ({ success: true }) };
    if (specifier.includes('lib/security')) return { requestContextResponse: () => null };
    if (specifier.includes('lib/validation')) return { validateParsePayload: (body, field) => ({ [field]: body[field] }), validationResponse: () => null };
    if (specifier.includes('revenueLock')) return { checkRevenueLock: async () => ({ allowed: true }) };
    throw new Error(`Unexpected dependency: ${specifier}`);
  },
  generateModule,
  generateRoutePath,
  path.dirname(generateRoutePath),
);
const generated = await generateModule.exports.POST({ json: async () => ({ message_text: 'We need a commercial shoot. Budget is $5000.' }) });
assert.equal(generated.status, 200);
assert.equal(generated.body.parsed_data.items[0].unitPrice, 0);
assert.equal(generated.body.core_decision, null);
assert.deepEqual(generated.body.ai, { mode: 'parser_only', source: 'quotes_generate', authority: 'suggestion_only' });

console.log('R56E-G-QE-INTEL-PROV-01 contract: PASS');
