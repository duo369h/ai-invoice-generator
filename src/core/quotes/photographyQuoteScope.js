export const PHOTOGRAPHY_SCOPE_VERSION = 2;

export const PHOTOGRAPHY_SCOPE_COMMON_KEYS = [
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

export const USAGE_RIGHTS_STATUS = ['unspecified', 'specified', 'not_applicable'];

const USAGE_RIGHTS_KEYS = [
  'status',
  'purpose',
  'media_channels',
  'territory',
  'license_duration',
  'exclusivity',
];

const PRESET_VERTICALS = {
  'wedding-shoot': 'Wedding',
  'portrait-session': 'Portrait',
  'event-photography': 'Event',
  'commercial-shoot': 'Commercial',
  'commercial-advertising': 'Commercial',
  'product-photography': 'Product',
  'food-photography': 'Food',
  'food-shoot': 'Food',
  'architecture-interior': 'Architecture & Interior',
  'architecture-shoot': 'Architecture & Interior',
};

const emptyUsageRights = () => ({
  status: 'unspecified',
  purpose: null,
  media_channels: [],
  territory: null,
  license_duration: null,
  exclusivity: null,
});

export function createEmptyPhotographyScope() {
  return {
    version: PHOTOGRAPHY_SCOPE_VERSION,
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
      usage_rights: emptyUsageRights(),
      delivery_deadline: null,
      exclusions: [],
      assumptions: [],
    },
  };
}

function normalizeString(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.reduce((entries, entry) => {
    const normalized = normalizeString(entry);
    if (normalized !== null && !seen.has(normalized)) {
      seen.add(normalized);
      entries.push(normalized);
    }
    return entries;
  }, []);
}

function normalizeDate(value) {
  const normalized = normalizeString(value);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized ? null : normalized;
}

function normalizeNonNegativeInteger(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) return null;
  const normalized = Number(value);
  return Number.isSafeInteger(normalized) && normalized >= 0 ? normalized : null;
}

function normalizeUsageRights(input = {}) {
  const status = USAGE_RIGHTS_STATUS.includes(input?.status) ? input.status : 'unspecified';
  if (status === 'not_applicable') return emptyUsageRightsWithStatus(status);
  return {
    status,
    purpose: normalizeString(input?.purpose),
    media_channels: normalizeStringArray(input?.media_channels),
    territory: normalizeString(input?.territory),
    license_duration: normalizeString(input?.license_duration),
    exclusivity: normalizeString(input?.exclusivity),
  };
}

function emptyUsageRightsWithStatus(status) {
  return { ...emptyUsageRights(), status };
}

export function normalizePhotographyScope(input = {}) {
  const source = input?.common && typeof input.common === 'object' ? input.common : {};
  return {
    version: PHOTOGRAPHY_SCOPE_VERSION,
    common: {
      shoot_type: normalizeString(source.shoot_type),
      shoot_date: normalizeDate(source.shoot_date),
      shoot_duration: normalizeNonNegativeInteger(source.shoot_duration),
      primary_location: normalizeString(source.primary_location),
      coverage_expectation: normalizeString(source.coverage_expectation),
      deliverables: normalizeStringArray(source.deliverables),
      final_image_count: normalizeNonNegativeInteger(source.final_image_count),
      retouched_image_count: normalizeNonNegativeInteger(source.retouched_image_count),
      delivery_format: normalizeStringArray(source.delivery_format),
      usage_rights: normalizeUsageRights(source.usage_rights),
      delivery_deadline: normalizeDate(source.delivery_deadline),
      exclusions: normalizeStringArray(source.exclusions),
      assumptions: normalizeStringArray(source.assumptions),
    },
  };
}

export function derivePhotographyVertical(presetId) {
  return PRESET_VERTICALS[presetId] || null;
}

export function hasUsageRightsDetails(usageRights = {}) {
  return USAGE_RIGHTS_KEYS
    .filter((key) => key !== 'status')
    .some((key) => Array.isArray(usageRights[key])
      ? usageRights[key].length > 0
      : normalizeString(usageRights[key]) !== null);
}

export function setPhotographyUsageRightsStatus(scope, status, { confirmClear = false } = {}) {
  const normalizedScope = normalizePhotographyScope(scope);
  const nextStatus = USAGE_RIGHTS_STATUS.includes(status) ? status : 'unspecified';
  const currentUsageRights = normalizedScope.common.usage_rights;
  if (nextStatus === 'not_applicable' && hasUsageRightsDetails(currentUsageRights) && !confirmClear) {
    return { scope: normalizedScope, requiresConfirmation: true };
  }
  return {
    scope: {
      ...normalizedScope,
      common: {
        ...normalizedScope.common,
        usage_rights: nextStatus === 'not_applicable'
          ? emptyUsageRightsWithStatus(nextStatus)
          : { ...currentUsageRights, status: nextStatus },
      },
    },
    requiresConfirmation: false,
  };
}

export function updatePhotographyScopeField(scope, field, value) {
  const normalizedScope = normalizePhotographyScope(scope);
  if (field.startsWith('usage_rights.')) {
    const usageKey = field.slice('usage_rights.'.length);
    if (!USAGE_RIGHTS_KEYS.includes(usageKey) || usageKey === 'status') return normalizedScope;
    const usageRights = {
      ...normalizedScope.common.usage_rights,
      [usageKey]: Array.isArray(value) ? normalizeStringArray(value) : normalizeString(value),
      status: 'specified',
    };
    return {
      ...normalizedScope,
      common: { ...normalizedScope.common, usage_rights: usageRights },
    };
  }
  if (!PHOTOGRAPHY_SCOPE_COMMON_KEYS.includes(field) || field === 'usage_rights') return normalizedScope;
  const nextValue = ['deliverables', 'delivery_format', 'exclusions', 'assumptions'].includes(field)
    ? normalizeStringArray(value)
    : ['shoot_date', 'delivery_deadline'].includes(field)
      ? normalizeDate(value)
      : ['shoot_duration', 'final_image_count', 'retouched_image_count'].includes(field)
        ? normalizeNonNegativeInteger(value)
        : normalizeString(value);
  return {
    ...normalizedScope,
    common: { ...normalizedScope.common, [field]: nextValue },
  };
}
