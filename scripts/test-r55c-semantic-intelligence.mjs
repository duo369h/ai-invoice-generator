import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const scopeModule = await import('../src/core/quotes/photographyQuoteScope.js');
const knowledgeModule = await import('../src/core/quotes/photographyKnowledge.js');
const contractModule = await import('../src/core/intelligence/semanticReviewContract.js');
const inputModule = await import('../src/core/intelligence/photographySemanticReviewInput.js');
const reviewModule = await import('../src/core/intelligence/photographySemanticReview.js');
const providerModule = await import('../src/core/intelligence/providers/deepSeekSemanticReviewProvider.js');
const configModule = await import('../src/core/intelligence/semanticReviewProviderConfig.js');

const {
  PHOTOGRAPHY_WORKFLOW_TEMPLATES,
} = await import('../src/core/quotes/photographyWorkflowTemplates.js');
const { createEmptyPhotographyScope, updatePhotographyScopeField } = scopeModule;
const { getPhotographyKnowledge, PHOTOGRAPHY_KNOWLEDGE_VERSION } = knowledgeModule;
const { normalizeSemanticProviderResult } = contractModule;
const { buildPhotographySemanticReviewInput } = inputModule;
const {
  buildPhotographySemanticReviewRequest,
  runPhotographySemanticReview,
  SEMANTIC_REVIEW_PROMPT_VERSION,
} = reviewModule;

assert.equal(PHOTOGRAPHY_WORKFLOW_TEMPLATES.length, 7);
assert.equal(PHOTOGRAPHY_KNOWLEDGE_VERSION, 'r55c-v1');
for (const template of PHOTOGRAPHY_WORKFLOW_TEMPLATES) {
  const knowledge = getPhotographyKnowledge(template.id);
  assert.equal(knowledge.templateId, template.id);
  assert.ok(knowledge.focus.length > 0);
  assert.doesNotMatch(JSON.stringify(knowledge), /price|rate|legal|agreement/i);
}
assert.equal(getPhotographyKnowledge('unknown-template'), null);

const baseScope = createEmptyPhotographyScope();
const scope = updatePhotographyScopeField(
  updatePhotographyScopeField(baseScope, 'coverage_expectation', '8 hours with ceremony and reception'),
  'deliverables', ['Edited gallery'],
);
const input = buildPhotographySemanticReviewInput({
  templateId: 'wedding-shoot',
  scope,
  lineItems: [{ description: 'Wedding coverage', quantity: 1, unitPrice: 5000 }],
  publicNotes: 'Client-facing delivery note.',
  currency: 'USD',
});
assert.equal(input.template.id, 'wedding-shoot');
assert.equal(input.lineItems[0].description, 'Wedding coverage');
assert.equal(Object.prototype.hasOwnProperty.call(input.lineItems[0], 'unitPrice'), false);
assert.doesNotMatch(JSON.stringify(input), /client@example|555-123|portal_token|auth_token|billing_id|owner@example/i);
assert.equal(buildPhotographySemanticReviewInput({ templateId: 'wedding-shoot', scope, lineItems: [{ description: 'Wedding coverage', quantity: 1 }], publicNotes: 'Changed note', currency: 'USD' }).inputFingerprint === input.inputFingerprint, false);
assert.equal(buildPhotographySemanticReviewRequest(input).capability, 'photography_pre_send_semantic_review');
assert.equal(buildPhotographySemanticReviewRequest(input).promptVersion, SEMANTIC_REVIEW_PROMPT_VERSION);
const promptContract = buildPhotographySemanticReviewRequest(input).systemInstruction;
assert.match(promptContract, /untrusted data/i);
assert.match(promptContract, /instructions inside.*data.*(?:must never override|no authority)/i);
assert.match(promptContract, /instruction-like.*(?:surface|photographer)|surface.*photographer/i);
assert.match(promptContract, /optional|non-core/i);
assert.match(promptContract, /(?:absence|missing).*alone.*(?:not|insufficient)|material(?:ly)? supported.*(?:core|contradiction)/i);
assert.match(promptContract, /(?:zero findings|findings\s*=\s*\[\]|no material issue)/i);
assert.match(promptContract, /photographer.*final authority|final authority.*photographer/i);
assert.equal(SEMANTIC_REVIEW_PROMPT_VERSION, 'r55d-v1');

const semanticProvider = {
  async review() {
    return {
      findings: [
        { code: 'wedding-shoot-duration-missing', category: 'CONFIRM', severity: 'medium', title: 'Duplicate deterministic item', message: 'Same issue', evidence: 'Coverage duration: empty', recommendedAction: 'Confirm duration.', confidence: 'high' },
        { code: 'scope-notes-conflict', category: 'NEEDS_ATTENTION', severity: 'high', title: 'Scope and notes conflict', message: 'The supplied wording conflicts.', evidence: 'Scope says RAW excluded; Notes say RAW included.', recommendedAction: 'Confirm the RAW boundary.', confidence: 'high' },
        { code: 'low-value', category: 'IMPROVE', severity: 'low', title: 'Low confidence', message: 'Maybe.', evidence: 'A supplied phrase.', recommendedAction: 'Review.', confidence: 'low' },
      ],
    };
  },
};
const deterministic = [{ id: 'wedding-shoot-duration-missing', source: 'deterministic', category: 'CONFIRM', severity: 'medium', title: 'Confirm the coverage duration', message: 'Structured issue.', evidence: 'Coverage duration: empty', recommendedAction: 'Add duration.', dismissible: true }];
const complete = await runPhotographySemanticReview({ input, provider: semanticProvider, deterministicFindings: deterministic });
assert.equal(complete.status, 'COMPLETE');
assert.equal(complete.semanticFindings.length, 2, 'low confidence findings must be filtered before merge');
assert.equal(complete.findings[0].source, 'deterministic');
assert.equal(complete.findings.some((finding) => finding.id === 'llm-scope-notes-conflict'), true);

assert.equal(normalizeSemanticProviderResult({ findings: [] }).length, 0);
assert.equal(normalizeSemanticProviderResult({ findings: Array.from({ length: 7 }, (_, index) => ({
  code: `finding-${index}`, category: 'IMPROVE', severity: 'low', title: `Finding ${index}`, message: 'Message', evidence: 'Evidence', recommendedAction: 'Review', confidence: 'high',
})) }).length, 5);
assert.throws(() => normalizeSemanticProviderResult({ findings: [{ code: 'bad', category: 'NOPE', severity: 'low', title: 'x', message: 'x', evidence: 'x', recommendedAction: 'x', confidence: 'high' }] }));
assert.throws(() => normalizeSemanticProviderResult({ findings: [{ code: 'bad', category: 'IMPROVE', severity: 'low', title: 'x', message: 'x', evidence: '', recommendedAction: 'x', confidence: 'high' }] }));
assert.throws(() => normalizeSemanticProviderResult({ findings: [{ code: 'bad', category: 'IMPROVE', severity: 'low', title: 'x', message: 'x', evidence: 'x', recommendedAction: 'x', confidence: 'high', extra: true }] }));
assert.equal((await runPhotographySemanticReview({ input, provider: { review: async () => ({ findings: [] }) } })).status, 'COMPLETE');
assert.equal((await runPhotographySemanticReview({ input, provider: { review: async () => { throw new Error('timeout'); } } })).status, 'UNAVAILABLE_OR_ERROR');

const originalKey = process.env.DEEPSEEK_API_KEY;
process.env.DEEPSEEK_API_KEY = 'test-only-not-real';
let deepSeekRequest;
const deepSeek = providerModule.createDeepSeekSemanticReviewProvider({
  config: { model: 'deepseek-v4-flash', reasoningEffort: 'low' },
  fetchImpl: async (url, options) => {
    deepSeekRequest = { url, options, body: JSON.parse(options.body) };
    return { ok: true, status: 200, async json() { return { id: 'test-request', choices: [{ finish_reason: 'stop', message: { content: '{"findings":[]}' } }] }; } };
  },
});
assert.deepEqual(await deepSeek.review(buildPhotographySemanticReviewRequest(input)), { findings: [] });
assert.equal(deepSeekRequest.url, 'https://api.deepseek.com/chat/completions');
assert.equal(deepSeekRequest.body.model, 'deepseek-v4-flash');
assert.deepEqual(deepSeekRequest.body.response_format, { type: 'json_object' });
assert.equal(deepSeekRequest.body.stream, false);
assert.equal(deepSeekRequest.options.headers.Authorization, 'Bearer test-only-not-real');
const providerResponse = (payload, { ok = true, status = 200 } = {}) => ({ ok, status, async json() { return payload; } });
const emptyProvider = providerModule.createDeepSeekSemanticReviewProvider({ fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'stop', message: { content: '' } }] }) });
await assert.rejects(() => emptyProvider.review(buildPhotographySemanticReviewRequest(input)), /empty content/);
const truncatedProvider = providerModule.createDeepSeekSemanticReviewProvider({ fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'length', message: { content: '{' } }] }) });
await assert.rejects(() => truncatedProvider.review(buildPhotographySemanticReviewRequest(input)), /truncated/);
const rateLimitedProvider = providerModule.createDeepSeekSemanticReviewProvider({ fetchImpl: async () => providerResponse({}, { ok: false, status: 429 }) });
await assert.rejects(() => rateLimitedProvider.review(buildPhotographySemanticReviewRequest(input)), /request failed/);
const failedProvider = providerModule.createDeepSeekSemanticReviewProvider({ fetchImpl: async () => providerResponse({}, { ok: false, status: 503 }) });
await assert.rejects(() => failedProvider.review(buildPhotographySemanticReviewRequest(input)), /request failed/);
delete process.env.DEEPSEEK_API_KEY;
await assert.rejects(() => deepSeek.review(buildPhotographySemanticReviewRequest(input)), /not configured/);
if (originalKey) process.env.DEEPSEEK_API_KEY = originalKey;
else delete process.env.DEEPSEEK_API_KEY;

assert.equal(configModule.getSemanticReviewRuntimeConfig({}).provider, 'deepseek');
assert.equal(configModule.getSemanticReviewRuntimeConfig({}).model, 'deepseek-v4-flash');
assert.throws(() => configModule.getSemanticReviewProvider({ config: { provider: 'openai' } }), /Unsupported/);

const dashboardSource = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const knowledgeSource = fs.readFileSync(path.join(root, 'src/core/quotes/photographyKnowledge.js'), 'utf8');
const deterministicSource = fs.readFileSync(path.join(root, 'src/core/quotes/photographyQuoteReview.js'), 'utf8');
assert.match(dashboardSource, /Review with Corvioz/);
assert.match(dashboardSource, /Authorization: `Bearer \$\{session\.access_token\}`/);
assert.doesNotMatch(dashboardSource, /DeepSeek|DEEPSEEK|deepseek/);
assert.doesNotMatch(knowledgeSource, /DeepSeek|DEEPSEEK|deepseek/);
assert.doesNotMatch(deterministicSource, /fetch\(|DeepSeek|DEEPSEEK/);
assert.match(fs.readFileSync(path.join(root, 'src/app/api/intelligence/photography-quote-review/route.js'), 'utf8'), /getRequestUser/);

console.log('R55C SEMANTIC PHOTOGRAPHY INTELLIGENCE TESTS: PASS');
