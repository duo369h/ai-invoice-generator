import {
  getPhotographyWorkflowFieldImportance,
  getPhotographyWorkflowTemplateById,
  PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE,
} from './photographyWorkflowTemplates.js';
import {
  hasUsageRightsDetails,
  normalizePhotographyScope,
} from './photographyQuoteScope.js';

export const REVIEW_RESULT_CATEGORIES = Object.freeze(['NEEDS_ATTENTION', 'CONFIRM', 'IMPROVE']);
export const REVIEW_SOURCES = Object.freeze(['deterministic', 'llm']);
export const REVIEW_SEVERITIES = Object.freeze(['high', 'medium', 'low']);

export const PHOTOGRAPHY_REVIEW_CONTRACT = Object.freeze({
  fields: Object.freeze(['id', 'source', 'category', 'severity', 'title', 'message', 'evidence', 'recommendedAction', 'dismissible']),
  semanticSourceReserved: 'llm',
});

export function createPhotographyReviewFinding({
  id,
  source = 'deterministic',
  category,
  severity = 'medium',
  title,
  message,
  evidence = null,
  recommendedAction,
  dismissible = true,
}) {
  if (!REVIEW_SOURCES.includes(source)) throw new Error(`Unsupported photography review source: ${source}`);
  if (!REVIEW_RESULT_CATEGORIES.includes(category)) throw new Error(`Unsupported photography review category: ${category}`);
  if (!REVIEW_SEVERITIES.includes(severity)) throw new Error(`Unsupported photography review severity: ${severity}`);
  return {
    id,
    source,
    category,
    severity,
    title,
    message,
    evidence,
    recommendedAction,
    dismissible: Boolean(dismissible),
  };
}

const present = (value) => Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== '';

const dateIsBefore = (left, right) => Boolean(left && right && left < right);

const addFinding = (findings, finding) => findings.push(createPhotographyReviewFinding(finding));

const productDeliverableTemplates = new Set(['product-photography', 'food-photography', 'architecture-interior']);

function hasMaterialDeliverableCommitment(common) {
  const deliverableText = common.deliverables.join(' ');
  const outputQuantity = /\b(?:up\s+to\s+)?\d+(?:\.\d+)?\s+(?:(?:edited|retouched|final|selected|campaign|hero|product)\s+){0,3}(?:images?|photos?|pictures?|selects?|deliverables?)\b/i.test(deliverableText)
    || /\bclient\s+selects?\s+\d+(?:\.\d+)?\s+(?:(?:final|edited|retouched)\s+)?(?:images?|photos?|pictures?)\b/i.test(deliverableText)
    || /\b\d+(?:\.\d+)?[-\s](?:image|photo)\s+(?:final\s+)?selection\b/i.test(deliverableText);
  return present(common.final_image_count) || outputQuantity;
}

function hasFixedCoverageWindow(common) {
  const match = String(common.coverage_expectation || '').match(/\b(\d{1,2}):(\d{2})\b\s*(?:to|[-–])\s*(\d{1,2}):(\d{2})\b/i);
  if (!match || !present(common.shoot_duration)) return false;
  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = Number(match[3]) * 60 + Number(match[4]);
  return endMinutes > startMinutes && endMinutes - startMinutes === common.shoot_duration;
}

function hasExtensionEvidence(common) {
  const text = JSON.stringify(common);
  return /\bpossible\s+extension\b/i.test(text)
    || /\b(?:event|coverage)\s+(?:may|can|could)\s+extend\b/i.test(text)
    || /\b(?:event|coverage)\s+(?:(?:may|can|could)\s+(?:be\s+)?|is\s+)?(?:running|run|runs)\s+late\b/i.test(text)
    || /\bcoverage\s+(?:may|can|could)\s+continue\b/i.test(text)
    || /\bcoverage\s+continues?\s+beyond\s+(?:the\s+)?(?:scheduled\s+end|stated\s+coverage|coverage\s+window)\b/i.test(text)
    || /\bbeyond\s+(?:the\s+)?(?:scheduled\s+end|stated\s+coverage|coverage\s+window)\b/i.test(text)
    || /\b(?:extra\s+hours?|additional\s+coverage)\b/i.test(text)
    || /\buncertain\s+end(?:\s+time)?\b/i.test(text);
}

function isUnsupportedFixedWindowOvertimeFinding(finding, common) {
  const text = JSON.stringify(finding);
  return hasFixedCoverageWindow(common)
    && !hasExtensionEvidence(common)
    && !hasExtensionEvidence(finding)
    && /overtime/i.test(text)
    && /(?:missing|unspecified|unclear|undefined|not\s+(?:stated|specified|defined)|policy|terms)/i.test(text);
}

export function filterPhotographySemanticFindings({ scope, semanticFindings = [] } = {}) {
  const common = normalizePhotographyScope(scope).common;
  return semanticFindings.filter((finding) => !isUnsupportedFixedWindowOvertimeFinding(finding, common));
}

export function buildPhotographyPreSendReview({ scope, templateId, maxFindings = 5 } = {}) {
  const normalizedScope = normalizePhotographyScope(scope);
  const common = normalizedScope.common;
  const template = getPhotographyWorkflowTemplateById(templateId);
  const findings = [];

  if (present(common.final_image_count) && present(common.retouched_image_count)
    && common.retouched_image_count > common.final_image_count) {
    addFinding(findings, {
      id: 'retouched-images-exceed-final-images',
      category: 'NEEDS_ATTENTION',
      severity: 'high',
      title: 'Retouched images exceed the final image count',
      message: 'The retouched image count is higher than the total final image count.',
      evidence: `Final images: ${common.final_image_count}; retouched images: ${common.retouched_image_count}`,
      recommendedAction: 'Check the two image counts before sending the Quote.',
    });
  }

  if (common.usage_rights.status === 'specified' && !hasUsageRightsDetails(common.usage_rights)) {
    addFinding(findings, {
      id: 'usage-rights-specified-without-details',
      category: 'NEEDS_ATTENTION',
      severity: 'high',
      title: 'Usage Rights is marked specified but has no details',
      message: 'The Quote says Usage Rights are specified, but no purpose, channel, territory, term or exclusivity is recorded.',
      evidence: 'Usage Rights status: specified; Usage Rights dimensions: empty',
      recommendedAction: 'Add the agreed usage dimensions or mark Usage Rights as not specified.',
    });
  }

  if (dateIsBefore(common.delivery_deadline, common.shoot_date)) {
    addFinding(findings, {
      id: 'delivery-deadline-before-shoot-date',
      category: 'NEEDS_ATTENTION',
      severity: 'high',
      title: 'Delivery deadline is before the shoot date',
      message: 'The recorded delivery deadline comes before the recorded shoot date.',
      evidence: `Shoot date: ${common.shoot_date}; delivery deadline: ${common.delivery_deadline}`,
      recommendedAction: 'Confirm both dates and update the one that is incorrect.',
    });
  }

  if (!present(common.deliverables) && getPhotographyWorkflowFieldImportance(templateId, 'deliverables') !== PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.OPTIONAL) {
    addFinding(findings, {
      id: 'important-deliverables-missing',
      category: 'NEEDS_ATTENTION',
      severity: 'medium',
      title: 'Important deliverables are not listed',
      message: `${template?.label || 'This workflow'} benefits from a client-readable deliverables list before the Quote is sent.`,
      evidence: 'Deliverables: empty',
      recommendedAction: 'List the gallery, files, image set or other client deliverables included in the Quote.',
    });
  }

  if (template?.id === 'commercial-shoot' && common.usage_rights.status === 'unspecified') {
    addFinding(findings, {
      id: 'commercial-usage-rights-unspecified',
      category: 'CONFIRM',
      severity: 'medium',
      title: 'Confirm Usage Rights for this campaign',
      message: 'Commercial work often depends on where, for how long and in which channels the images may be used.',
      evidence: 'Commercial / Advertising workflow; Usage Rights status: unspecified',
      recommendedAction: 'Confirm the intended use with the client or record that Usage Rights are not applicable.',
    });
  }

  if (['wedding-shoot', 'event-photography'].includes(template?.id) && !present(common.shoot_duration)) {
    addFinding(findings, {
      id: `${template.id}-duration-missing`,
      category: 'CONFIRM',
      severity: 'medium',
      title: 'Confirm the coverage duration',
      message: `${template.label} coverage is easier to understand when the expected hours or minutes are recorded.`,
      evidence: 'Coverage duration: empty',
      recommendedAction: 'Add the expected coverage duration, or make the timing clear in the client notes.',
    });
  }

  if (template?.id === 'portrait-session' && !present(common.final_image_count) && !present(common.coverage_expectation)) {
    addFinding(findings, {
      id: 'portrait-image-expectation-unclear',
      category: 'CONFIRM',
      severity: 'medium',
      title: 'Confirm the portrait image expectation',
      message: 'The Quote does not yet record either an expected final image count or the session coverage expectation.',
      evidence: 'Final image count: empty; coverage expectation: empty',
      recommendedAction: 'Add an expected image count or describe the looks, setups and selection process.',
    });
  }

  if (['product-photography', 'food-photography', 'architecture-interior'].includes(template?.id)
    && !present(common.coverage_expectation) && !present(common.deliverables)) {
    addFinding(findings, {
      id: `${template.id}-coverage-unclear`,
      category: 'IMPROVE',
      severity: 'medium',
      title: 'Clarify the coverage and deliverables',
      message: `${template.label} work is easier to review when the planned coverage and client deliverables are visible together.`,
      evidence: 'Coverage expectation: empty; deliverables: empty',
      recommendedAction: 'Add a short coverage description and list the included deliverables.',
    });
  }

  if (productDeliverableTemplates.has(template?.id)
    && present(common.deliverables)
    && !hasMaterialDeliverableCommitment(common)
    && getPhotographyWorkflowFieldImportance(templateId, 'final_image_count') === PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.CORE) {
    addFinding(findings, {
      id: `${template.id}-deliverable-clarity`,
      category: 'NEEDS_ATTENTION',
      severity: 'medium',
      title: 'The deliverable output is not sufficiently defined',
      message: 'The Quote names a deliverable but does not define a material output quantity or selection boundary.',
      evidence: `Deliverables: ${common.deliverables.join('; ')}; final image count: empty`,
      recommendedAction: 'Clarify the expected output quantity or selection boundary before sending the Quote.',
    });
  }

  const categoryOrder = { NEEDS_ATTENTION: 0, CONFIRM: 1, IMPROVE: 2 };
  const severityOrder = { high: 0, medium: 1, low: 2 };
  const limitedFindings = findings
    .sort((left, right) => categoryOrder[left.category] - categoryOrder[right.category] || severityOrder[left.severity] - severityOrder[right.severity])
    .slice(0, Math.max(0, maxFindings));
  Object.defineProperty(limitedFindings, 'photographyMaterialityContext', {
    value: Object.freeze({ templateId, scope: normalizedScope }),
    enumerable: false,
  });
  return limitedFindings;
}
