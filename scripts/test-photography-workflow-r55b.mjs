import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const registryPath = path.join(root, 'src/core/quotes/photographyWorkflowTemplates.js');
const reviewPath = path.join(root, 'src/core/quotes/photographyQuoteReview.js');
const dashboardPath = path.join(root, 'src/components/dashboard/Dashboard.js');
const presetsPath = path.join(root, 'src/core/quotes/photographyQuotePresets.js');

assert.equal(fs.existsSync(registryPath), true, 'R55B must add a photography workflow template registry');
assert.equal(fs.existsSync(reviewPath), true, 'R55B must add a deterministic photography review engine');

const registrySource = fs.readFileSync(registryPath, 'utf8');
const reviewSource = fs.readFileSync(reviewPath, 'utf8');
const dashboardSource = fs.readFileSync(dashboardPath, 'utf8');
const presetsSource = fs.readFileSync(presetsPath, 'utf8');
const migrationDirectory = path.join(root, 'supabase/migrations');

const {
  LEGACY_PHOTOGRAPHY_PRESET_COMPATIBILITY,
  PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE,
  PHOTOGRAPHY_WORKFLOW_TEMPLATES,
  getPhotographyWorkflowFieldImportance,
  getPhotographyWorkflowTemplateById,
} = await import('../src/core/quotes/photographyWorkflowTemplates.js');
const {
  PHOTOGRAPHY_REVIEW_CONTRACT,
  buildPhotographyPreSendReview,
  createPhotographyReviewFinding,
} = await import('../src/core/quotes/photographyQuoteReview.js');
const { createEmptyPhotographyScope, updatePhotographyScopeField } = await import('../src/core/quotes/photographyQuoteScope.js');

assert.match(registrySource, /PHOTOGRAPHY_WORKFLOW_TEMPLATES/);
for (const label of ['Wedding', 'Portrait', 'Event', 'Commercial \/ Advertising', 'Product', 'Food', 'Architecture & Interior']) {
  assert.match(registrySource, new RegExp(label.replace(/[&/]/g, '\\$&')));
}
assert.match(registrySource, /CORE/);
assert.match(registrySource, /RECOMMENDED/);
assert.match(registrySource, /OPTIONAL/);
assert.match(registrySource, /legacy/i);
assert.doesNotMatch(registrySource, /defaultLineItems/);

for (const ruleName of ['retouched', 'usage', 'deadline', 'deliverables', 'commercial', 'duration', 'image']) {
  assert.match(reviewSource.toLowerCase(), new RegExp(ruleName));
}
assert.match(reviewSource, /NEEDS_ATTENTION/);
assert.match(reviewSource, /CONFIRM/);
assert.match(reviewSource, /IMPROVE/);
assert.match(reviewSource, /llm/);
assert.match(reviewSource, /recommendedAction/);

assert.match(dashboardSource, /Review with Corvioz/);
assert.match(dashboardSource, /Needs attention/);
assert.match(dashboardSource, /Confirm/);
assert.match(dashboardSource, /Improve/);
assert.match(dashboardSource, /Show more scope fields/);
assert.match(dashboardSource, /getPhotographyWorkflowTemplateById/);
assert.match(dashboardSource, /buildPhotographyPreSendReview/);
assert.doesNotMatch(dashboardSource, /handleAiScopeExpansion|quotePrompt|isExpandingQuote/);
const templateHandlerStart = dashboardSource.indexOf('const handleApplyQuotePreset =');
const templateHandlerEnd = dashboardSource.indexOf('\n  const handleSkipQuotePreset', templateHandlerStart);
assert.ok(templateHandlerStart >= 0 && templateHandlerEnd > templateHandlerStart);
assert.doesNotMatch(dashboardSource.slice(templateHandlerStart, templateHandlerEnd), /setQItems|setQCurrency|setQNotes/);
assert.match(presetsSource, /wedding-shoot/);
assert.equal(fs.readdirSync(migrationDirectory).some((file) => file.toLowerCase().includes('photography')), false);

assert.equal(PHOTOGRAPHY_WORKFLOW_TEMPLATES.length, 7);
assert.deepEqual(PHOTOGRAPHY_WORKFLOW_TEMPLATES.map((item) => item.id), [
  'wedding-shoot', 'portrait-session', 'event-photography', 'commercial-shoot',
  'product-photography', 'food-photography', 'architecture-interior',
]);
assert.equal(getPhotographyWorkflowTemplateById('commercial-advertising').id, 'commercial-shoot');
assert.equal(getPhotographyWorkflowTemplateById('food-shoot').id, 'food-photography');
assert.equal(LEGACY_PHOTOGRAPHY_PRESET_COMPATIBILITY['wedding-shoot'], 'wedding-shoot');
assert.equal(getPhotographyWorkflowFieldImportance('commercial-shoot', 'usage_rights.purpose'), PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE.CORE);
assert.deepEqual(getPhotographyWorkflowTemplateById('portrait-session').optionalSubtypeSuggestions, [
  'Personal portrait', 'Headshot', 'Personal branding', 'Family', 'Couple / Engagement', 'Maternity', 'Other',
]);

const baseScope = createEmptyPhotographyScope();
const countMismatchScope = updatePhotographyScopeField(
  updatePhotographyScopeField(
    updatePhotographyScopeField(baseScope, 'final_image_count', 10),
    'retouched_image_count',
    12,
  ),
  'deliverables',
  ['Edited gallery'],
);
const mismatchFindings = buildPhotographyPreSendReview({ scope: countMismatchScope, templateId: 'portrait-session' });
assert.equal(mismatchFindings.some((finding) => finding.id === 'retouched-images-exceed-final-images'), true);
assert.equal(mismatchFindings.some((finding) => finding.source === 'deterministic'), true);

const usageUnclearScope = updatePhotographyScopeField(baseScope, 'usage_rights.purpose', '');
const usageFindings = buildPhotographyPreSendReview({
  scope: { ...usageUnclearScope, common: { ...usageUnclearScope.common, usage_rights: { ...usageUnclearScope.common.usage_rights, status: 'specified' } } },
  templateId: 'commercial-shoot',
});
assert.equal(usageFindings.some((finding) => finding.id === 'usage-rights-specified-without-details'), true);

const dateScope = updatePhotographyScopeField(
  updatePhotographyScopeField(baseScope, 'shoot_date', '2026-09-15'),
  'delivery_deadline',
  '2026-09-10',
);
assert.equal(buildPhotographyPreSendReview({ scope: dateScope, templateId: 'wedding-shoot' }).some((finding) => finding.id === 'delivery-deadline-before-shoot-date'), true);
assert.equal(buildPhotographyPreSendReview({ scope: baseScope, templateId: 'commercial-shoot' }).some((finding) => finding.id === 'commercial-usage-rights-unspecified'), true);
assert.equal(buildPhotographyPreSendReview({ scope: baseScope, templateId: 'wedding-shoot' }).some((finding) => finding.id === 'wedding-shoot-duration-missing'), true);
assert.equal(buildPhotographyPreSendReview({ scope: baseScope, templateId: 'product-photography' }).some((finding) => finding.id === 'product-photography-coverage-unclear'), true);
assert.equal(buildPhotographyPreSendReview({ scope: baseScope, templateId: 'wedding-shoot', maxFindings: 3 }).length <= 3, true);

const sourceReadyFinding = createPhotographyReviewFinding({
  id: 'future-semantic-check',
  source: 'llm',
  category: 'IMPROVE',
  title: 'Future semantic finding',
  message: 'Reserved for R55C.',
  recommendedAction: 'Review the wording.',
});
assert.equal(sourceReadyFinding.source, 'llm');
assert.ok(PHOTOGRAPHY_REVIEW_CONTRACT.fields.includes('recommendedAction'));

const immutableScope = JSON.parse(JSON.stringify(countMismatchScope));
buildPhotographyPreSendReview({ scope: countMismatchScope, templateId: 'portrait-session' });
assert.deepEqual(countMismatchScope, immutableScope, 'review must not mutate structured Scope');

console.log('R55B PHOTOGRAPHY WORKFLOW TESTS: PASS');
