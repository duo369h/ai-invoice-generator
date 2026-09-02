import { getPhotographyWorkflowTemplateById } from '../quotes/photographyWorkflowTemplates.js';
import { normalizePhotographyScope } from '../quotes/photographyQuoteScope.js';

export const SEMANTIC_REVIEW_INPUT_LIMITS = Object.freeze({
  maxLineItems: 30,
  maxLineItemDescription: 500,
  maxPublicNotes: 4000,
  maxScopeListItems: 30,
  maxScopeText: 500,
  maxRequestBytes: 24_000,
});

export class SemanticReviewInputError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SemanticReviewInputError';
    this.code = 'SEMANTIC_REVIEW_INVALID_INPUT';
    this.status = 400;
  }
}

function assertText(value, field, maxLength) {
  if (typeof value !== 'string') throw new SemanticReviewInputError(`${field} must be text`);
  if (value.length > maxLength) throw new SemanticReviewInputError(`${field} is too large`);
  return value.trim();
}

function assertScopeBounds(scope) {
  const common = scope.common;
  const scalarFields = ['shoot_type', 'shoot_date', 'primary_location', 'coverage_expectation', 'delivery_deadline'];
  for (const field of scalarFields) assertText(common[field] || '', `scope.${field}`, SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeText);
  for (const field of ['deliverables', 'delivery_format', 'exclusions', 'assumptions']) {
    const values = common[field];
    if (!Array.isArray(values) || values.length > SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeListItems) {
      throw new SemanticReviewInputError(`scope.${field} is too large`);
    }
    values.forEach((value, index) => assertText(value, `scope.${field}[${index}]`, SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeText));
  }
  const usage = common.usage_rights;
  assertText(usage.status || '', 'scope.usage_rights.status', 30);
  for (const field of ['purpose', 'territory', 'license_duration', 'exclusivity']) {
    assertText(usage[field] || '', `scope.usage_rights.${field}`, SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeText);
  }
  if (!Array.isArray(usage.media_channels) || usage.media_channels.length > SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeListItems) {
    throw new SemanticReviewInputError('scope.usage_rights.media_channels is too large');
  }
  usage.media_channels.forEach((value, index) => assertText(value, `scope.usage_rights.media_channels[${index}]`, SEMANTIC_REVIEW_INPUT_LIMITS.maxScopeText));
}

function normalizeLineItems(items) {
  if (!Array.isArray(items) || items.length > SEMANTIC_REVIEW_INPUT_LIMITS.maxLineItems) {
    throw new SemanticReviewInputError('lineItems must be an array within its size limit');
  }
  return items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new SemanticReviewInputError(`lineItems[${index}] must be an object`);
    const description = assertText(item.description || '', `lineItems[${index}].description`, SEMANTIC_REVIEW_INPUT_LIMITS.maxLineItemDescription);
    if (!description) throw new SemanticReviewInputError(`lineItems[${index}].description is required`);
    const quantity = Number(item.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 1_000_000) throw new SemanticReviewInputError(`lineItems[${index}].quantity is invalid`);
    return { description, quantity };
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export function fingerprintSemanticReviewInput(value) {
  const serialized = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildPhotographySemanticReviewInput({ templateId, scope, lineItems, publicNotes = '', currency = 'USD' } = {}) {
  const template = getPhotographyWorkflowTemplateById(templateId);
  if (!template) throw new SemanticReviewInputError('A supported photography workflow template is required');
  const normalizedScope = normalizePhotographyScope(scope);
  assertScopeBounds(normalizedScope);
  const normalizedNotes = assertText(publicNotes, 'publicNotes', SEMANTIC_REVIEW_INPUT_LIMITS.maxPublicNotes);
  const normalizedCurrency = assertText(currency || 'USD', 'currency', 10).toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new SemanticReviewInputError('currency must be a three-letter code');
  const input = {
    template: { id: template.id, label: template.label },
    scope: normalizedScope,
    lineItems: normalizeLineItems(lineItems),
    publicNotes: normalizedNotes,
    currency: normalizedCurrency,
  };
  const serializedBytes = new TextEncoder().encode(JSON.stringify(input)).length;
  if (serializedBytes > SEMANTIC_REVIEW_INPUT_LIMITS.maxRequestBytes) throw new SemanticReviewInputError('semantic review input is too large');
  return Object.freeze({ ...input, inputFingerprint: fingerprintSemanticReviewInput(input) });
}
