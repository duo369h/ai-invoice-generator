import assert from 'node:assert/strict';
import {
  buildScopeSnapshot,
  getScopeSnapshotSurfaceState,
} from '../src/components/dashboard/dashboardWave1.mjs';

const metadata = JSON.stringify({
  edit_count: 3,
  quote_preset_id: 'photo-branding',
  quote_preset_name: 'Photography Branding',
  workflow_terms: ['internal'],
});

const userNoteWithMetadata = buildScopeSnapshot([{
  id: 'q-user-note',
  notes: `Generated during onboarding\n\n---METADATA---\n${metadata}`,
}]);
assert.equal(userNoteWithMetadata.notes, 'Generated during onboarding', 'user-facing note must exclude recognized metadata');
assert.doesNotMatch(userNoteWithMetadata.notes || '', /---METADATA---|edit_count|quote_preset|workflow_terms|\{|\}/);

const metadataOnly = buildScopeSnapshot([{
  id: 'q-metadata-only',
  notes: `---METADATA---\n${metadata}`,
}]);
assert.equal(metadataOnly.notes, null, 'metadata-only notes must not render as a visible note');

const encodedMetadataOnly = buildScopeSnapshot([{
  id: 'q-encoded-metadata',
  notes: '---METADATA---\n{&quot;edit_count&quot;:4,&quot;workflow_terms&quot;:[&quot;internal&quot;]}',
}]);
assert.equal(encodedMetadataOnly.notes, null, 'HTML-encoded metadata must not render');

assert.equal(buildScopeSnapshot([{ id: 'q-plain', notes: 'A plain client-facing note.' }]).notes, 'A plain client-facing note.');
assert.equal(buildScopeSnapshot([{ id: 'q-empty', notes: '' }]).notes, null);
assert.equal(buildScopeSnapshot([{ id: 'q-null', notes: null }]).notes, null);

const arbitraryUserText = 'User payload: {"workflow_terms":"ordinary user text"}';
assert.equal(buildScopeSnapshot([{ id: 'q-arbitrary', notes: arbitraryUserText }]).notes, arbitraryUserText, 'arbitrary JSON-like user text must remain unchanged');

const source = [{
  id: 'q-immutable',
  notes: `Keep this note\n\n---METADATA---\n${metadata}`,
  currency: 'EUR',
  total: 12345,
}];
const sourceBefore = structuredClone(source);
const immutableSnapshot = buildScopeSnapshot(source);
assert.deepEqual(source, sourceBefore, 'display sanitization must not mutate stored notes');
assert.equal(immutableSnapshot.currency, 'EUR', 'R43 stored currency authority must remain intact');
assert.equal(immutableSnapshot.total, 12345, 'R43 stored total authority must remain intact');

assert.equal(
  buildScopeSnapshot([
    { id: 'q-older-updated', updated_at: '2026-08-01T10:00:00Z', created_at: '2026-07-01T10:00:00Z', notes: 'old' },
    { id: 'q-newer-created-only', created_at: '2026-08-02T10:00:00Z', notes: 'new' },
  ]).id,
  'q-newer-created-only',
  'R43 effective recency selection must remain intact',
);
assert.equal(buildScopeSnapshot([{ id: 'q-missing-currency', currency: null, notes: 'note' }]).currency, null);
assert.equal(getScopeSnapshotSurfaceState({ error: new Error('refresh failed'), quotes: [{ id: 'q-existing' }] }).mode, 'stale');

console.log('DASHBOARD_OVERVIEW_SCOPE_SNAPSHOT_R43_FIX2_TEST=PASS');
