import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const routePath = path.join(root, 'src/app/api/quotes/route.js');
const routeSource = fs.readFileSync(routePath, 'utf8');
assert.match(routeSource, /buildQuoteProvenanceForSave/, 'server Quote route must enforce provenance merge');
assert.match(routeSource, /quote_provenance_v1/, 'server Quote route must read and persist provenance');
assert.match(routeSource, /from\(["']leads["']\)/, 'server must verify Lead ownership for new raw source');

function loadModule(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const loadedModule = { exports };
  const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', code);
  fn(exports, (id) => {
    for (const [needle, value] of Object.entries(mocks)) {
      if (id.includes(needle)) return value;
    }
    throw new Error(`Unexpected dependency: ${id}`);
  }, loadedModule, path.join(root, file), path.dirname(path.join(root, file)));
  return loadedModule.exports;
}

function makeDb({ quotes = [], leads = [] } = {}) {
  const state = {
    profiles: [{ id: 'user-1', plan: 'free' }],
    clients: [],
    quotes: quotes.map((quote) => structuredClone(quote)),
    leads: leads.map((lead) => structuredClone(lead)),
  };

  const matches = (row, filters) => filters.every(([column, value]) => row?.[column] === value);
  const from = (table) => {
    const query = {
      filters: [],
      updatePayload: null,
      select() { return this; },
      eq(column, value) { this.filters.push([column, value]); return this; },
      order() { return this; },
      update(payload) { this.updatePayload = payload; return this; },
      async maybeSingle() {
        const row = state[table].find((item) => matches(item, this.filters)) || null;
        if (row && this.updatePayload) Object.assign(row, this.updatePayload);
        return { data: row, error: null };
      },
      async then(resolve) {
        const rows = state[table].filter((item) => matches(item, this.filters));
        if (this.updatePayload) rows.forEach((item) => Object.assign(item, this.updatePayload));
        resolve({ data: rows, error: null });
      },
    };
    return query;
  };
  return { state, from, rpc: async () => ({ data: null, error: null }) };
}

function loadQuoteRoute(db) {
  const NextResponse = { json: (body, init = {}) => ({ status: init.status || 200, body, json: async () => body }) };
  const deserializeQuoteNotes = (value = '') => {
    const marker = '\n\n---METADATA---\n';
    const index = String(value).lastIndexOf(marker);
    if (index < 0) return { notes: String(value || ''), metadata: {} };
    return { notes: String(value).slice(0, index), metadata: JSON.parse(String(value).slice(index + marker.length)) };
  };
  const serializeQuoteNotes = (publicNotes, metadata) => `${publicNotes || ''}\n\n---METADATA---\n${JSON.stringify(metadata || {})}`;
  const validateSerializedQuoteNotes = (value) => value;
  const buildQuoteProvenanceForSave = ({ existingProvenance = null, draftProvenance = null, existingScope = null, currentScope = null } = {}) => {
    const existing = existingProvenance || {};
    const draft = draftProvenance || {};
    const raw = existing.raw_client_source?.kind === 'lead_message' && existing.raw_client_source.source_field === 'message'
      ? existing.raw_client_source
      : (draft.raw_client_source?.kind === 'lead_message' && draft.raw_client_source.source_field === 'message' ? draft.raw_client_source : undefined);
    const machine = existing.machine_draft?.source === 'quotes_generate' && existing.machine_draft.authority === 'suggestion_only'
      ? existing.machine_draft
      : (draft.machine_draft?.source === 'quotes_generate' && draft.machine_draft.authority === 'suggestion_only' ? draft.machine_draft : undefined);
    return {
      ...(raw ? { raw_client_source: raw } : {}),
      ...(machine ? { machine_draft: machine } : {}),
      ...((existing.original_scope_baseline || existingScope || currentScope) ? { original_scope_baseline: existing.original_scope_baseline || existingScope || currentScope } : {}),
      canonical_authority: { authority: 'photographer', confirmation_action: 'explicit_quote_save' },
    };
  };
  const createQuoteWithAtomicQuota = async (_client, userId, plan, payload) => {
    const row = { ...payload, id: payload.id || `quote-${db.state.quotes.length + 1}`, user_id: userId };
    db.state.quotes.push(row);
    return { data: row, quota: { documentsAllowed: true, documentsLimit: plan === 'starter' ? 30 : 5 } };
  };
  return loadModule('src/app/api/quotes/route.js', {
    'next/server': { NextResponse },
    'lib/supabase-service': {
      createServiceSupabaseClient: () => db,
      createSupabasePortalToken: async () => '',
      writeAuditLog: async () => {},
    },
    'lib/supabase': {
      getRequestUser: async () => ({ mode: 'supabase', user: { id: 'user-1', email: 'owner@example.com' }, supabase: db }),
      getDocumentQuota: async () => ({ documentsAllowed: true }),
      createQuoteWithAtomicQuota,
    },
    'lib/rate-limit': { rateLimitAuthenticated: async () => ({ success: true }) },
    'lib/security': { authRequiredResponse: () => null, getIp: () => '127.0.0.1', requestContextResponse: () => null },
    'lib/validation': { validateQuotePayload: (body) => body, validateObject: (body) => body, enumValue: (value) => value, validationResponse: () => null },
    'quoteNotes.mjs': { deserializeQuoteNotes, serializeQuoteNotes, validateSerializedQuoteNotes },
    'quoteProvenance.js': { buildQuoteProvenanceForSave, isRecognizedRawClientSource: (value) => value?.kind === 'lead_message' && typeof value.lead_id === 'string' && value.source_field === 'message' },
    'product-analytics-server': { recordProductAnalyticsEvent: async () => {} },
    'lib/entitlements': { getUserEntitlements: () => ({ client_portal: false }) },
  });
}

function makeRequest(body) {
  return { json: async () => body, headers: new Headers({ 'content-type': 'application/json' }) };
}

const scope = (name) => ({ common: { shoot_type: name, usage_rights: { status: 'specified', purpose: name } } });
const provenance = ({ leadId, baseline, canonical = { authority: 'client', confirmation_action: 'ai_generated' }, machine = { source: 'quotes_generate', authority: 'suggestion_only' } } = {}) => ({
  ...(leadId ? { raw_client_source: { kind: 'lead_message', lead_id: leadId, source_field: 'message' } } : {}),
  ...(machine ? { machine_draft: machine } : {}),
  ...(baseline ? { original_scope_baseline: baseline } : {}),
  canonical_authority: canonical,
});
const notes = (currentScope, quoteProvenance, extras = {}) => `Public\n\n---METADATA---\n${JSON.stringify({ photography_scope_v2: currentScope, quote_provenance_v1: quoteProvenance, ...extras })}`;
const baseBody = (body) => ({
  quote_number: 'QT-PROV-1',
  client_name: 'Client',
  client_email: 'client@example.com',
  client_address: 'Address',
  items: [{ description: 'Shoot', quantity: 1, unitPrice: 0 }],
  discount_rate: 0,
  tax_rate: 0,
  currency: 'USD',
  status: 'draft',
  ...body,
});

{
  const existing = {
    id: 'quote-attack', user_id: 'user-1', status: 'draft', client_id: null,
    client_name: 'Client', client_email: 'client@example.com', client_address: 'Address',
    notes: notes(scope('A'), provenance({ baseline: scope('A'), leadId: 'lead-a', machine: { source: 'quotes_generate', authority: 'suggestion_only' } }), { comments: ['keep'], files: ['file-a'] }),
  };
  const db = makeDb({ quotes: [existing], leads: [{ id: 'lead-a', freelancer_id: 'user-1' }, { id: 'lead-b', freelancer_id: 'user-1' }] });
  const route = loadQuoteRoute(db);
  const response = await route.POST(makeRequest(baseBody({
    id: existing.id,
    notes: notes(scope('C'), provenance({ baseline: scope('X'), leadId: 'lead-b' })),
  })));
  assert.equal(response.status, 201, 'existing Quote update succeeds');
  const saved = db.state.quotes[0];
  const savedMetadata = JSON.parse(saved.notes.split('\n\n---METADATA---\n').at(-1));
  assert.deepEqual(savedMetadata.quote_provenance_v1.original_scope_baseline, scope('A'), 'persisted baseline wins over client conflict');
  assert.deepEqual(savedMetadata.photography_scope_v2, scope('C'), 'current Scope remains photographer-editable');
  assert.equal(savedMetadata.quote_provenance_v1.raw_client_source.lead_id, 'lead-a', 'established Lead source is immutable');
  assert.deepEqual(savedMetadata.quote_provenance_v1.canonical_authority, { authority: 'photographer', confirmation_action: 'explicit_quote_save' });
  assert.deepEqual(savedMetadata.quote_provenance_v1.machine_draft, { source: 'quotes_generate', authority: 'suggestion_only' });
  assert.deepEqual(savedMetadata.comments, ['keep'], 'unrelated existing metadata is preserved');
}

{
  const existing = {
    id: 'quote-legacy', user_id: 'user-1', status: 'draft', client_id: null,
    client_name: 'Client', client_email: 'client@example.com', client_address: 'Address',
    notes: notes(scope('A'), null, { workflow_terms: ['shoot'] }),
  };
  const db = makeDb({ quotes: [existing] });
  const route = loadQuoteRoute(db);
  const response = await route.POST(makeRequest(baseBody({ id: existing.id, notes: notes(scope('B'), null) })));
  assert.equal(response.status, 201);
  const savedMetadata = JSON.parse(db.state.quotes[0].notes.split('\n\n---METADATA---\n').at(-1));
  assert.deepEqual(savedMetadata.quote_provenance_v1.original_scope_baseline, scope('A'), 'legacy edit migrates baseline from persisted Scope');
  assert.deepEqual(savedMetadata.photography_scope_v2, scope('B'));
  assert.deepEqual(savedMetadata.workflow_terms, ['shoot']);
}

{
  const db = makeDb({ leads: [{ id: 'lead-owned', freelancer_id: 'user-1' }] });
  const route = loadQuoteRoute(db);
  const response = await route.POST(makeRequest(baseBody({
    notes: notes(scope('New'), provenance({ leadId: 'lead-owned', baseline: scope('forged'), machine: { source: 'quotes_generate', authority: 'canonical' } })),
  })));
  assert.equal(response.status, 201);
  const savedMetadata = JSON.parse(db.state.quotes[0].notes.split('\n\n---METADATA---\n').at(-1));
  assert.deepEqual(savedMetadata.quote_provenance_v1.original_scope_baseline, scope('New'));
  assert.deepEqual(savedMetadata.quote_provenance_v1.raw_client_source, { kind: 'lead_message', lead_id: 'lead-owned', source_field: 'message' });
  assert.equal(savedMetadata.quote_provenance_v1.machine_draft, undefined, 'client cannot persist machine output as canonical authority');
  assert.deepEqual(savedMetadata.quote_provenance_v1.canonical_authority, { authority: 'photographer', confirmation_action: 'explicit_quote_save' });
}

for (const leadId of ['lead-foreign', 'lead-missing']) {
  const db = makeDb({ leads: leadId === 'lead-foreign' ? [{ id: leadId, freelancer_id: 'user-2' }] : [] });
  const route = loadQuoteRoute(db);
  const response = await route.POST(makeRequest(baseBody({ notes: notes(scope('Invalid'), provenance({ leadId })) })));
  assert.equal(response.status, 403, `${leadId} raw source must be rejected`);
  assert.equal(db.state.quotes.length, 0, `${leadId} must not create a Quote`);
}

console.log('R56E-G-QE-INTEL-PROV-01-FIX-1 server authority runtime: PASS');
