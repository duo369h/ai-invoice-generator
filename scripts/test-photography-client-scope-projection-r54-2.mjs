import assert from 'node:assert/strict';
import {
  CLIENT_SCOPE_FIELD_CLASSIFICATION,
  CLIENT_SCOPE_GROUP_ORDER,
  CLIENT_SCOPE_LABELS,
  projectPhotographyScopeForClient,
  projectPhotographyScopeFromQuoteNotes,
  selectPhotographyEmailSummaryCandidate,
} from '../src/core/quotes/photographyQuoteScopePresentation.js';
import {
  serializeQuoteNotes,
} from '../src/components/dashboard/quoteNotes.mjs';

const persistedScope = {
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
      status_for_internal_use_only: 'discard me',
    },
    delivery_deadline: '2026-09-15',
    exclusions: [' Travel ', 'Travel', ''],
    assumptions: [' Client selects images ', 'Client selects images'],
    unknown_scope_key: 'discard me',
  },
};

const projected = projectPhotographyScopeForClient(persistedScope);
assert.deepEqual(projected, {
  hasScope: true,
  groups: [
    {
      id: 'shoot',
      label: 'Shoot',
      items: [
        { key: 'shoot_type', label: 'Shoot', value: 'Editorial' },
        { key: 'shoot_date', label: 'Shoot date', value: '2026-09-01' },
        { key: 'shoot_duration', label: 'Coverage duration', value: 240 },
        { key: 'primary_location', label: 'Location', value: 'Studio A' },
      ],
    },
    {
      id: 'coverage',
      label: 'Coverage & deliverables',
      items: [
        { key: 'coverage_expectation', label: 'Coverage', value: 'Full day' },
        { key: 'deliverables', label: 'Included deliverables', value: ['RAW', 'JPEG'] },
        { key: 'final_image_count', label: 'Final images', value: 20 },
        { key: 'retouched_image_count', label: 'Retouched images', value: 8 },
      ],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      items: [
        { key: 'delivery_deadline', label: 'Delivery', value: '2026-09-15' },
        { key: 'delivery_format', label: 'File format(s)', value: ['TIFF', 'JPEG'] },
      ],
    },
    {
      id: 'usage_rights',
      label: 'Usage rights',
      items: [
        { key: 'usage_rights.purpose', label: 'Intended use', value: 'Campaign' },
        { key: 'usage_rights.media_channels', label: 'Channels', value: ['Web', 'Print'] },
        { key: 'usage_rights.territory', label: 'Territory', value: 'Global' },
        { key: 'usage_rights.license_duration', label: 'License term', value: '12 months' },
        { key: 'usage_rights.exclusivity', label: 'Exclusivity', value: 'None' },
      ],
    },
    {
      id: 'boundaries',
      label: 'Boundaries',
      items: [
        { key: 'exclusions', label: 'Not included', value: ['Travel'] },
        { key: 'assumptions', label: 'Assumptions', value: ['Client selects images'] },
      ],
    },
  ],
});

assert.deepEqual(CLIENT_SCOPE_GROUP_ORDER, [
  'shoot',
  'coverage',
  'delivery',
  'usage_rights',
  'boundaries',
]);
assert.deepEqual(CLIENT_SCOPE_FIELD_CLASSIFICATION, {
  primary: [
    'shoot_type',
    'shoot_date',
    'primary_location',
    'coverage_expectation',
    'deliverables',
    'final_image_count',
    'delivery_deadline',
    'exclusions',
  ],
  secondary: [
    'shoot_duration',
    'retouched_image_count',
    'delivery_format',
    'usage_rights.purpose',
    'assumptions',
  ],
  ifSpecified: [
    'usage_rights.media_channels',
    'usage_rights.territory',
    'usage_rights.license_duration',
    'usage_rights.exclusivity',
  ],
  excluded: ['usage_rights.status'],
});
assert.equal(Object.keys(CLIENT_SCOPE_LABELS).some((label) => label.includes('status')), false);

const storedNotes = serializeQuoteNotes('Public notes stay separate', {
  quote_preset_id: 'commercial-shoot',
  quote_preset_name: 'Commercial Shoot',
  workflow_terms: ['internal'],
  comments: [{ body: 'internal comment' }],
  files: [{ name: 'internal.pdf' }],
  edit_count: 4,
  billing_type: 'standard',
  price: 999999,
  ai_recommendation: 'never expose',
  raw_json: '{"opaque":true}',
  photography_scope_v2: persistedScope,
});
assert.deepEqual(projectPhotographyScopeFromQuoteNotes(storedNotes), projected);
assert.deepEqual(projectPhotographyScopeFromQuoteNotes(serializeQuoteNotes('Only notes', {
  quote_preset_id: 'commercial-shoot',
})), { hasScope: false, groups: [] });

const usageStatusCases = [
  ['unspecified', {}, false],
  ['specified', { purpose: 'Campaign', media_channels: ['Web'] }, true],
  ['specified', {}, false],
  ['not_applicable', { purpose: 'Campaign', media_channels: ['Web'] }, false],
];
for (const [status, usageRights, hasScope] of usageStatusCases) {
  const result = projectPhotographyScopeForClient({
    common: {
      usage_rights: { status, ...usageRights },
    },
  });
  assert.equal(result.hasScope, hasScope, `usage status ${status} projection state`);
  assert.equal(result.groups.some((group) => group.id === 'usage_rights'), hasScope, `usage status ${status} group`);
  assert.equal(result.groups.flatMap((group) => group.items).some((item) => item.key === 'usage_rights.status'), false);
}

const emptyProjection = projectPhotographyScopeForClient({
  common: {
    shoot_type: ' ',
    deliverables: [],
    usage_rights: { status: 'specified' },
  },
});
assert.deepEqual(emptyProjection, { hasScope: false, groups: [] });
assert.equal(JSON.stringify(emptyProjection).includes('Not specified'), false);
assert.equal(JSON.stringify(emptyProjection).includes('—'), false);

const summaryCases = [
  ['shoot_type', 'Editorial'],
  ['shoot_date', '2026-09-01'],
  ['primary_location', 'Studio A'],
  ['delivery_deadline', '2026-09-15'],
  ['final_image_count', 20],
];
for (const [key, value] of summaryCases) {
  const candidate = selectPhotographyEmailSummaryCandidate({
    common: {
      shoot_type: key === 'shoot_type' ? value : null,
      shoot_date: key === 'shoot_date' ? value : null,
      primary_location: key === 'primary_location' ? value : null,
      delivery_deadline: key === 'delivery_deadline' ? value : null,
      final_image_count: key === 'final_image_count' ? value : null,
      usage_rights: { status: 'specified', purpose: 'Must never be selected' },
    },
  });
  assert.equal(candidate.key, key);
  assert.equal(candidate.value, value);
}
assert.deepEqual(
  selectPhotographyEmailSummaryCandidate({ common: { deliverables: ['Gallery delivery'] } }),
  { key: 'deliverables', label: 'Included deliverables', value: 'Gallery delivery' },
);
assert.equal(selectPhotographyEmailSummaryCandidate({ common: { usage_rights: { status: 'specified', purpose: 'No' } } }), null);

const priorityScope = {
  common: {
    shoot_type: 'Editorial',
    shoot_date: '2026-09-01',
    primary_location: 'Studio A',
    delivery_deadline: '2026-09-15',
    final_image_count: 20,
    deliverables: ['Gallery delivery'],
    usage_rights: { status: 'specified', purpose: 'Never selected' },
  },
};
const prioritySequence = [
  ['shoot_type', 'Editorial'],
  ['shoot_date', '2026-09-01'],
  ['primary_location', 'Studio A'],
  ['delivery_deadline', '2026-09-15'],
  ['final_image_count', 20],
  ['deliverables', 'Gallery delivery'],
];
for (let index = 0; index < prioritySequence.length; index += 1) {
  const candidate = selectPhotographyEmailSummaryCandidate(priorityScope);
  assert.deepEqual(candidate, {
    key: prioritySequence[index][0],
    label: CLIENT_SCOPE_LABELS[prioritySequence[index][0]],
    value: prioritySequence[index][1],
  }, `populated candidate ${prioritySequence[index][0]} wins by priority`);
  priorityScope.common[prioritySequence[index][0]] = null;
}
assert.equal(selectPhotographyEmailSummaryCandidate(priorityScope), null, 'email summary has no candidate after the full fallback sequence');

const sourceInput = structuredClone(persistedScope);
projectPhotographyScopeForClient(sourceInput);
assert.deepEqual(sourceInput, persistedScope);

console.log('R54.2A photography client Scope projection tests passed.');
