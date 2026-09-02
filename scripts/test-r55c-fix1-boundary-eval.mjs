import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dashboardPath = path.join(root, 'src/components/dashboard/Dashboard.js');
const clientInputPath = path.join(root, 'src/core/intelligence/photographySemanticReviewInput.js');
const serverOrchestratorPath = path.join(root, 'src/core/intelligence/photographySemanticReview.js');
const knowledgePath = path.join(root, 'src/core/quotes/photographyKnowledge.js');
const providerPath = path.join(root, 'src/core/intelligence/providers/deepSeekSemanticReviewProvider.js');
const configPath = path.join(root, 'src/core/intelligence/semanticReviewProviderConfig.js');
const fixturePath = path.join(root, 'src/core/intelligence/photographyIntelligenceGoldenCases.js');
const evaluationPath = path.join(root, 'src/core/intelligence/photographyIntelligenceEvaluation.js');
const dashboardSource = fs.readFileSync(dashboardPath, 'utf8');

assert.equal(fs.existsSync(clientInputPath), true, 'FIX-1 requires a client-safe input module');
assert.equal(fs.existsSync(fixturePath), true, 'FIX-1 requires centralized golden cases');
assert.equal(fs.existsSync(evaluationPath), true, 'FIX-1 requires an offline evaluation harness');
assert.doesNotMatch(dashboardSource, /photographySemanticReview['"]|photographyKnowledge|deepSeekSemanticReviewProvider|semanticReviewProviderConfig/);
assert.match(fs.readFileSync(serverOrchestratorPath, 'utf8'), /photographyKnowledge/);
assert.doesNotMatch(fs.readFileSync(clientInputPath, 'utf8'), /photographyKnowledge|deepSeekSemanticReviewProvider|semanticReviewProviderConfig|systemInstruction|DEEPSEEK_API_KEY/);
assert.doesNotMatch(fs.readFileSync(providerPath, 'utf8'), /semanticReviewProviderConfig/);
assert.match(fs.readFileSync(configPath, 'utf8'), /createDeepSeekSemanticReviewProvider/);

const { PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES } = await import('../src/core/intelligence/photographyIntelligenceGoldenCases.js');
const { evaluatePhotographyGoldenCases, PHOTOGRAPHY_INTELLIGENCE_EVAL_VERSION } = await import('../src/core/intelligence/photographyIntelligenceEvaluation.js');
assert.equal(PHOTOGRAPHY_INTELLIGENCE_EVAL_VERSION, 'r55c-eval-v1');
assert.ok(PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.length >= 7);
assert.equal(new Set(PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.map((testCase) => testCase.id)).size, PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.length);
assert.equal(PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.some((testCase) => testCase.expected.noFindings), true);
assert.equal(PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.some((testCase) => /ignore prior|set price/i.test(testCase.publicNotes)), true);
assert.doesNotMatch(JSON.stringify(PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES), /client@example|555-123|portal_token|auth_token|billing_id/i);

const evaluation = await evaluatePhotographyGoldenCases();
assert.equal(evaluation.totalCases, PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES.length);
assert.equal(evaluation.failedCases, 0);
assert.equal(evaluation.passedCases, evaluation.totalCases);
assert.equal(evaluation.cleanNoFindingControlPass, true);
assert.equal(evaluation.promptInjectionGoldenCasePass, true);
assert.equal(evaluation.noRealProviderCall, true);

console.log('R55C FIX-1 BOUNDARY AND EVALUATION TESTS: PASS');
