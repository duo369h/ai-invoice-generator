import {
  createPhotographyReviewFinding,
  filterPhotographySemanticFindings,
} from '../quotes/photographyQuoteReview.js';

export const SEMANTIC_REVIEW_CAPABILITY = 'photography_pre_send_semantic_review';
export const SEMANTIC_REVIEW_MAX_FINDINGS = 5;
export const SEMANTIC_REVIEW_CONFIDENCE = Object.freeze(['high', 'medium', 'low']);
export const SEMANTIC_REVIEW_REQUEST_CONTRACT = Object.freeze([
  'capability', 'promptVersion', 'knowledgeVersion', 'systemInstruction', 'input',
]);
export const SEMANTIC_REVIEW_PROVIDER_CONTRACT = Object.freeze({ method: 'review', result: 'SemanticReviewProviderResult' });

function comparable(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function isDeterministicOverlap(semanticFinding, deterministicFindings) {
  const semanticCode = semanticFinding.id.replace(/^llm-/, '');
  const semanticTitle = comparable(semanticFinding.title);
  const semanticEvidence = comparable(semanticFinding.evidence);
  return deterministicFindings.some((finding) => (
    finding.id === semanticCode
      || comparable(finding.title) === semanticTitle
      || (semanticEvidence && comparable(finding.evidence) === semanticEvidence)
  ));
}

export function mergePhotographyReviewFindings({ deterministicFindings = [], semanticFindings = [] } = {}) {
  const merged = [...deterministicFindings];
  const seen = new Set(deterministicFindings.map((finding) => `${finding.source}:${finding.id}`));
  const context = deterministicFindings.photographyMaterialityContext;
  const materialFindings = context
    ? filterPhotographySemanticFindings({ scope: context.scope, semanticFindings })
    : semanticFindings;
  for (const finding of materialFindings.slice(0, SEMANTIC_REVIEW_MAX_FINDINGS)) {
    if (isDeterministicOverlap(finding, deterministicFindings)) continue;
    const key = `${finding.source}:${finding.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(finding);
  }
  return merged;
}

export function isSemanticReviewProvider(provider) {
  return Boolean(provider && typeof provider.review === 'function');
}

const ALLOWED_FINDING_KEYS = new Set([
  'code', 'category', 'severity', 'title', 'message', 'evidence', 'recommendedAction', 'confidence',
]);

export class SemanticReviewValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SemanticReviewValidationError';
    this.code = 'SEMANTIC_REVIEW_INVALID_RESULT';
  }
}

function cleanText(value, field, maxLength) {
  if (typeof value !== 'string') throw new SemanticReviewValidationError(`${field} must be text`);
  const cleaned = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  if (!cleaned || cleaned.length > maxLength) {
    throw new SemanticReviewValidationError(`${field} must be non-empty and within its size limit`);
  }
  return cleaned;
}

function normalizeCode(value) {
  const code = cleanText(value, 'finding.code', 80).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(code)) {
    throw new SemanticReviewValidationError('finding.code has an unsupported format');
  }
  return code;
}

function assertPlainObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new SemanticReviewValidationError(`${field} must be an object`);
  }
}

function normalizeFinding(rawFinding, index) {
  assertPlainObject(rawFinding, `findings[${index}]`);
  if (Object.keys(rawFinding).some((key) => !ALLOWED_FINDING_KEYS.has(key))) {
    throw new SemanticReviewValidationError(`findings[${index}] contains unsupported fields`);
  }
  const category = rawFinding.category;
  const severity = rawFinding.severity;
  const confidence = rawFinding.confidence;
  if (!['NEEDS_ATTENTION', 'CONFIRM', 'IMPROVE'].includes(category)) {
    throw new SemanticReviewValidationError(`findings[${index}] has an unsupported category`);
  }
  if (!['high', 'medium', 'low'].includes(severity)) {
    throw new SemanticReviewValidationError(`findings[${index}] has an unsupported severity`);
  }
  if (!SEMANTIC_REVIEW_CONFIDENCE.includes(confidence)) {
    throw new SemanticReviewValidationError(`findings[${index}] has an unsupported confidence`);
  }
  const evidence = cleanText(rawFinding.evidence, `findings[${index}].evidence`, 600);
  const finding = createPhotographyReviewFinding({
    id: `llm-${normalizeCode(rawFinding.code)}`,
    source: 'llm',
    category,
    severity,
    title: cleanText(rawFinding.title, `findings[${index}].title`, 160),
    message: cleanText(rawFinding.message, `findings[${index}].message`, 600),
    evidence,
    recommendedAction: cleanText(rawFinding.recommendedAction, `findings[${index}].recommendedAction`, 400),
    dismissible: true,
  });
  return { finding, confidence };
}

export function normalizeSemanticProviderResult(result) {
  assertPlainObject(result, 'provider result');
  if (Object.keys(result).some((key) => key !== 'findings')) {
    throw new SemanticReviewValidationError('provider result contains unsupported fields');
  }
  if (!Array.isArray(result.findings)) {
    throw new SemanticReviewValidationError('provider result findings must be an array');
  }

  const normalized = [];
  const seenIds = new Set();
  for (const [index, rawFinding] of result.findings.slice(0, SEMANTIC_REVIEW_MAX_FINDINGS).entries()) {
    const { finding, confidence } = normalizeFinding(rawFinding, index);
    if (confidence === 'low' || seenIds.has(finding.id)) continue;
    seenIds.add(finding.id);
    normalized.push(finding);
  }
  return normalized;
}
