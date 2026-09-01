import { deserializeQuoteNotes } from '../../components/dashboard/quoteNotes.mjs';
import {
  hasUsageRightsDetails,
  normalizePhotographyScope,
} from './photographyQuoteScope.js';

export const CLIENT_SCOPE_GROUP_ORDER = Object.freeze([
  'shoot',
  'coverage',
  'delivery',
  'usage_rights',
  'boundaries',
]);

export const CLIENT_SCOPE_FIELD_CLASSIFICATION = Object.freeze({
  primary: Object.freeze([
    'shoot_type',
    'shoot_date',
    'primary_location',
    'coverage_expectation',
    'deliverables',
    'final_image_count',
    'delivery_deadline',
    'exclusions',
  ]),
  secondary: Object.freeze([
    'shoot_duration',
    'retouched_image_count',
    'delivery_format',
    'usage_rights.purpose',
    'assumptions',
  ]),
  ifSpecified: Object.freeze([
    'usage_rights.media_channels',
    'usage_rights.territory',
    'usage_rights.license_duration',
    'usage_rights.exclusivity',
  ]),
  excluded: Object.freeze(['usage_rights.status']),
});

export const CLIENT_SCOPE_LABELS = Object.freeze({
  shoot_type: 'Shoot',
  shoot_date: 'Shoot date',
  shoot_duration: 'Coverage duration',
  primary_location: 'Location',
  coverage_expectation: 'Coverage',
  deliverables: 'Included deliverables',
  final_image_count: 'Final images',
  retouched_image_count: 'Retouched images',
  delivery_format: 'File format(s)',
  'usage_rights.purpose': 'Intended use',
  'usage_rights.media_channels': 'Channels',
  'usage_rights.territory': 'Territory',
  'usage_rights.license_duration': 'License term',
  'usage_rights.exclusivity': 'Exclusivity',
  delivery_deadline: 'Delivery',
  exclusions: 'Not included',
  assumptions: 'Assumptions',
});

const GROUP_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: 'shoot',
    label: 'Shoot',
    fields: Object.freeze(['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location']),
  }),
  Object.freeze({
    id: 'coverage',
    label: 'Coverage & deliverables',
    fields: Object.freeze([
      'coverage_expectation',
      'deliverables',
      'final_image_count',
      'retouched_image_count',
    ]),
  }),
  Object.freeze({
    id: 'delivery',
    label: 'Delivery',
    fields: Object.freeze(['delivery_deadline', 'delivery_format']),
  }),
  Object.freeze({
    id: 'usage_rights',
    label: 'Usage rights',
    fields: Object.freeze([
      'usage_rights.purpose',
      'usage_rights.media_channels',
      'usage_rights.territory',
      'usage_rights.license_duration',
      'usage_rights.exclusivity',
    ]),
  }),
  Object.freeze({
    id: 'boundaries',
    label: 'Boundaries',
    fields: Object.freeze(['exclusions', 'assumptions']),
  }),
]);

const EMAIL_SUMMARY_PRIORITY = Object.freeze([
  'shoot_type',
  'shoot_date',
  'primary_location',
  'delivery_deadline',
  'final_image_count',
  'deliverables',
]);

function readScopeValue(scope, field) {
  return field.split('.').reduce((value, key) => value?.[key], scope.common);
}

function hasClientValue(value) {
  return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
}

function copyClientValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function buildItem(scope, field) {
  const value = readScopeValue(scope, field);
  if (!hasClientValue(value)) return null;
  return {
    key: field,
    label: CLIENT_SCOPE_LABELS[field],
    value: copyClientValue(value),
  };
}

function usageRightsIsVisible(usageRights) {
  return usageRights.status === 'specified' && hasUsageRightsDetails(usageRights);
}

function buildGroup(scope, definition) {
  if (definition.id === 'usage_rights' && !usageRightsIsVisible(scope.common.usage_rights)) return null;
  const items = definition.fields.map((field) => buildItem(scope, field)).filter(Boolean);
  if (items.length === 0) return null;
  return { id: definition.id, label: definition.label, items };
}

export function projectPhotographyScopeForClient(persistedScope) {
  const normalizedScope = normalizePhotographyScope(persistedScope);
  const groups = GROUP_DEFINITIONS.map((definition) => buildGroup(normalizedScope, definition)).filter(Boolean);
  return { hasScope: groups.length > 0, groups };
}

export function projectPhotographyScopeFromQuoteNotes(storedNotes) {
  const parsedNotes = deserializeQuoteNotes(storedNotes);
  return projectPhotographyScopeForClient(parsedNotes.metadata?.photography_scope_v2);
}

export function selectPhotographyEmailSummaryCandidate(persistedScope) {
  const projection = projectPhotographyScopeForClient(persistedScope);
  const items = projection.groups.flatMap((group) => group.items);
  for (const key of EMAIL_SUMMARY_PRIORITY) {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) continue;
    return key === 'deliverables'
      ? { ...item, value: item.value[0] }
      : { ...item };
  }
  return null;
}
