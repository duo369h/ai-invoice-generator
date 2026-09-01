import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  PHOTOGRAPHY_SCOPE_VERSION,
  PHOTOGRAPHY_SCOPE_COMMON_KEYS,
  USAGE_RIGHTS_STATUS,
  createEmptyPhotographyScope,
  derivePhotographyVertical,
  hasUsageRightsDetails,
  normalizePhotographyScope,
  setPhotographyUsageRightsStatus,
  updatePhotographyScopeField,
} from '../src/core/quotes/photographyQuoteScope.js';
import {
  deserializeQuoteNotes,
  serializeQuoteNotes,
} from '../src/components/dashboard/quoteNotes.mjs';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dashboardSource = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const scopeSource = fs.readFileSync(path.join(root, 'src/core/quotes/photographyQuoteScope.js'), 'utf8');
const presetSource = fs.readFileSync(path.join(root, 'src/core/quotes/photographyQuotePresets.js'), 'utf8');

const sourceBlock = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source end marker: ${endMarker}`);
  return source.slice(start, end);
};

const expectedCommonKeys = [
  'shoot_type',
  'shoot_date',
  'shoot_duration',
  'primary_location',
  'coverage_expectation',
  'deliverables',
  'final_image_count',
  'retouched_image_count',
  'delivery_format',
  'usage_rights',
  'delivery_deadline',
  'exclusions',
  'assumptions',
];

assert.equal(PHOTOGRAPHY_SCOPE_VERSION, 2);
assert.deepEqual(PHOTOGRAPHY_SCOPE_COMMON_KEYS, expectedCommonKeys);
assert.deepEqual(USAGE_RIGHTS_STATUS, ['unspecified', 'specified', 'not_applicable']);
assert.equal(scopeSource.includes('vertical.fields'), false);
assert.equal(scopeSource.includes('preset_id'), false);
assert.equal(scopeSource.includes('fetch('), false);
assert.equal(scopeSource.includes('model'), false);

const emptyScope = createEmptyPhotographyScope();
assert.deepEqual(emptyScope, {
  version: 2,
  common: {
    shoot_type: null,
    shoot_date: null,
    shoot_duration: null,
    primary_location: null,
    coverage_expectation: null,
    deliverables: [],
    final_image_count: null,
    retouched_image_count: null,
    delivery_format: [],
    usage_rights: {
      status: 'unspecified',
      purpose: null,
      media_channels: [],
      territory: null,
      license_duration: null,
      exclusivity: null,
    },
    delivery_deadline: null,
    exclusions: [],
    assumptions: [],
  },
});

const normalized = normalizePhotographyScope({
  version: 999,
  common: {
    shoot_type: '  Editorial  ',
    shoot_date: '2026-09-01',
    shoot_duration: '240',
    primary_location: '  Studio A ',
    coverage_expectation: ' Full day ',
    deliverables: [' RAW ', 'JPEG', 'RAW', ''],
    final_image_count: '20',
    retouched_image_count: 8,
    delivery_format: [' TIFF ', 'JPEG', 'TIFF'],
    usage_rights: {
      status: 'specified',
      purpose: '  Campaign  ',
      media_channels: [' Web ', 'Print', 'Web'],
      territory: ' Global ',
      license_duration: ' 12 months ',
      exclusivity: ' None ',
      unknown_usage_key: 'discard me',
    },
    delivery_deadline: '2026-09-15',
    exclusions: [' Travel ', 'Travel', ''],
    assumptions: [' Client selects images ', 'Client selects images'],
    unknown_scope_key: 'discard me',
  },
  vertical: { type: 'must not persist' },
});
assert.deepEqual(normalized, {
  version: 2,
  common: {
    shoot_type: 'Editorial',
    shoot_date: '2026-09-01',
    shoot_duration: 240,
    primary_location: 'Studio A',
    coverage_expectation: 'Full day',
    deliverables: ['RAW', 'JPEG'],
    final_image_count: 20,
    retouched_image_count: 8,
    delivery_format: ['TIFF', 'JPEG'],
    usage_rights: {
      status: 'specified',
      purpose: 'Campaign',
      media_channels: ['Web', 'Print'],
      territory: 'Global',
      license_duration: '12 months',
      exclusivity: 'None',
    },
    delivery_deadline: '2026-09-15',
    exclusions: ['Travel'],
    assumptions: ['Client selects images'],
  },
});

const invalidValues = normalizePhotographyScope({
  common: {
    shoot_date: '2026-02-30',
    shoot_duration: '4 hours',
    final_image_count: -1,
    retouched_image_count: 1.5,
    delivery_deadline: '09/15/2026',
    usage_rights: { status: 'invalid' },
  },
});
assert.equal(invalidValues.common.shoot_date, null);
assert.equal(invalidValues.common.shoot_duration, null);
assert.equal(invalidValues.common.final_image_count, null);
assert.equal(invalidValues.common.retouched_image_count, null);
assert.equal(invalidValues.common.delivery_deadline, null);
assert.equal(invalidValues.common.usage_rights.status, 'unspecified');

const presetVerticals = {
  'wedding-shoot': 'Wedding',
  'portrait-session': 'Portrait',
  'event-photography': 'Event',
  'commercial-shoot': 'Commercial',
  'product-photography': 'Product',
};
for (const [presetId, vertical] of Object.entries(presetVerticals)) {
  assert.equal(derivePhotographyVertical(presetId), vertical);
}
assert.equal(derivePhotographyVertical(null), null);
assert.equal(derivePhotographyVertical('unknown-preset'), null);
for (const presetId of Object.keys(presetVerticals)) assert.match(presetSource, new RegExp(presetId));

const scopeWithDetails = updatePhotographyScopeField(emptyScope, 'usage_rights.purpose', 'Brand campaign');
assert.equal(scopeWithDetails.common.usage_rights.status, 'specified');
assert.equal(scopeWithDetails.common.usage_rights.purpose, 'Brand campaign');
assert.equal(hasUsageRightsDetails(scopeWithDetails.common.usage_rights), true);
const notApplicablePending = setPhotographyUsageRightsStatus(scopeWithDetails, 'not_applicable');
assert.equal(notApplicablePending.requiresConfirmation, true);
assert.equal(notApplicablePending.scope.common.usage_rights.purpose, 'Brand campaign');
const notApplicable = setPhotographyUsageRightsStatus(scopeWithDetails, 'not_applicable', { confirmClear: true });
assert.equal(notApplicable.requiresConfirmation, false);
assert.deepEqual(notApplicable.scope.common.usage_rights, {
  status: 'not_applicable',
  purpose: null,
  media_channels: [],
  territory: null,
  license_duration: null,
  exclusivity: null,
});
assert.equal(updatePhotographyScopeField(emptyScope, 'shoot_type', '  Portrait  ').common.shoot_type, 'Portrait');

const metadata = {
  edit_count: 4,
  comments: [{ body: 'internal comment' }],
  files: [{ name: 'internal.pdf' }],
  billing_type: 'standard',
  billing_mode: 'manual',
  quote_preset_id: 'portrait-session',
  quote_preset_name: 'Portrait Session',
  workflow_terms: ['shoot', 'delivery'],
  future_key: { preserved: true },
  photography_scope_v2: normalized,
};
const storedNotes = serializeQuoteNotes('  Public client notes  ', metadata);
const parsedNotes = deserializeQuoteNotes(storedNotes);
assert.equal(parsedNotes.notes, 'Public client notes');
assert.deepEqual(parsedNotes.metadata, metadata);
assert.equal(parsedNotes.future_key.preserved, true);
assert.deepEqual(parsedNotes.photography_scope_v2, normalized);
assert.equal(storedNotes.includes('Public client notes'), true);

const emptyLegacy = deserializeQuoteNotes('Legacy public note');
assert.equal(emptyLegacy.notes, 'Legacy public note');
assert.deepEqual(emptyLegacy.metadata, {});
assert.equal(emptyLegacy.billing_type, 'standard');
assert.deepEqual(deserializeQuoteNotes('').metadata, {});
assert.equal(deserializeQuoteNotes('Only public\n\n---METADATA---\n{"broken":').notes, 'Only public\n\n---METADATA---\n{"broken":');
assert.equal(parsedNotes.notes.includes('photography_scope_v2'), false);
assert.equal(parsedNotes.notes.includes('---METADATA---'), false);

const mergedMetadata = {
  ...parsedNotes.metadata,
  photography_scope_v2: normalizePhotographyScope({ common: { shoot_type: 'Updated' } }),
};
const merged = deserializeQuoteNotes(serializeQuoteNotes(parsedNotes.notes, mergedMetadata));
assert.equal(merged.metadata.future_key.preserved, true);
assert.equal(merged.metadata.photography_scope_v2.common.shoot_type, 'Updated');
assert.equal(merged.metadata.quote_preset_id, 'portrait-session');

assert.match(dashboardSource, /photography_scope_v2/);
assert.match(dashboardSource, /Photography Scope/);
for (const label of ['Shoot', 'Coverage & Deliverables', 'Usage Rights', 'Delivery & Boundaries']) {
  assert.match(dashboardSource, new RegExp(label.replace('&', '&(?:amp;)?')));
}
assert.match(dashboardSource, /Not specified/);
assert.match(dashboardSource, /setPhotographyUsageRightsStatus/);
assert.match(dashboardSource, /serializeQuoteNotes/);
assert.match(dashboardSource, /updateQPhotographyScope/);
assert.match(dashboardSource, /setQPhotographyScope\(createEmptyPhotographyScope\(\)\)/);
assert.match(dashboardSource, /setQPhotographyScope\(normalizePhotographyScope/);
assert.match(dashboardSource, /setQPhotographyScope\(createEmptyPhotographyScope\(\)\)/);
assert.match(dashboardSource, /quote_preset_id/);
assert.equal(dashboardSource.includes('setQNotes(quote.notes || \'\')'), false);
assert.equal(dashboardSource.includes('notes: qNotes,\n        status: qStatus'), false);
assert.equal(dashboardSource.includes('setQPhotographyScope(normalizePhotographyScope(quoteScope))'), true);
assert.equal(dashboardSource.includes('vertical: {'), false);
assert.equal(dashboardSource.includes('usage fee'), false);

const resetAccountScopedState = sourceBlock(
  dashboardSource,
  'const resetAccountScopedState = useCallback(() => {',
  '\n  }, ['
);
assert.match(resetAccountScopedState, /setQPhotographyScope\(createEmptyPhotographyScope\(\)\)/);

const explicitLogout = sourceBlock(
  dashboardSource,
  'const handleSignOut = async () => {',
  '\n  // Auth initialization'
);
const explicitLogoutSuccess = sourceBlock(explicitLogout, '    try {', '    } catch (error)');
const signOutCallIndex = explicitLogoutSuccess.indexOf('supabaseClient.auth.signOut()');
const clearDashboardIndex = explicitLogoutSuccess.indexOf('clearDashboardData()');
const resetAccountStateIndex = explicitLogoutSuccess.indexOf('resetAccountScopedState()');
const redirectIndex = explicitLogoutSuccess.indexOf("router.replace('/auth')");
assert.ok(signOutCallIndex >= 0, 'Explicit logout must call signOut');
assert.ok(clearDashboardIndex > signOutCallIndex, 'Explicit logout must clear dashboard data after signOut');
assert.ok(resetAccountStateIndex > clearDashboardIndex, 'Explicit logout must reset account state after dashboard data');
assert.ok(redirectIndex > resetAccountStateIndex, 'Explicit logout must reset account state before navigation');
const explicitLogoutFailure = explicitLogout.slice(explicitLogout.indexOf('    } catch (error)'));
assert.equal(explicitLogoutFailure.includes('resetAccountScopedState()'), false, 'Failed logout must not reset account state');

const authListener = sourceBlock(
  dashboardSource,
  'const { data: listener } = supabaseClient.auth.onAuthStateChange',
  '\n    return () => {'
);
assert.match(dashboardSource, /if \(event === 'SIGNED_OUT'\) return 'clear';/);
const accountSwitchPath = sourceBlock(authListener, 'if (isAccountSwitch) {', '      sessionRef.current =');
const accountSwitchClearIndex = accountSwitchPath.indexOf('clearDashboardData()');
const accountSwitchResetIndex = accountSwitchPath.indexOf('resetAccountScopedState()');
assert.ok(accountSwitchClearIndex >= 0, 'A→B switch must clear dashboard data');
assert.ok(accountSwitchResetIndex > accountSwitchClearIndex, 'A→B switch must reset account state after dashboard data');

const authClearPathStart = authListener.lastIndexOf('      } else {\n        clearAnalyticsUserId();');
assert.notEqual(authClearPathStart, -1, 'Missing auth-state clear path');
const authClearPath = authListener.slice(authClearPathStart, authListener.indexOf('      setAuthChecked(true);', authClearPathStart));
const authClearDashboardIndex = authClearPath.indexOf('clearDashboardData()');
const authClearResetIndex = authClearPath.indexOf('resetAccountScopedState()');
assert.ok(authClearDashboardIndex >= 0, 'Auth-state clear must clear dashboard data');
assert.ok(authClearResetIndex > authClearDashboardIndex, 'Auth-state clear must reset account state after dashboard data');

const migrationFiles = fs.readdirSync(path.join(root, 'supabase/migrations'));
assert.equal(migrationFiles.some((file) => file.includes('photography_scope')), false);

console.log('R54.1 Photography Quote Scope V2 tests passed.');
