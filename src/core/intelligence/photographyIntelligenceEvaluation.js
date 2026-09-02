import { buildPhotographyPreSendReview } from '../quotes/photographyQuoteReview.js';
import { buildPhotographySemanticReviewInput } from './photographySemanticReviewInput.js';
import { runPhotographySemanticReview } from './photographySemanticReview.js';
import {
  PHOTOGRAPHY_INTELLIGENCE_EVAL_VERSION,
  PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES,
} from './photographyIntelligenceGoldenCases.js';

const lower = (value) => String(value || '').toLowerCase();
const findingText = (findings) => lower(JSON.stringify(findings));

function casePasses(testCase, result) {
  const text = findingText(result.semanticFindings);
  const expectedTopicsPass = (testCase.expected.topics || []).every((topic) => text.includes(lower(topic)));
  const expectedCategoriesPass = Object.entries(testCase.expected.categories || {}).every(([topic, category]) => (
    result.semanticFindings.some((item) => item.id === `llm-${topic}` && item.category === category)
  ));
  const forbiddenAbsent = (testCase.forbidden.terms || []).every((term) => !text.includes(lower(term)));
  const noFindingsPass = !testCase.expected.noFindings || result.semanticFindings.length === 0;
  return { expectedTopicsPass, expectedCategoriesPass, forbiddenAbsent, noFindingsPass, pass: expectedTopicsPass && expectedCategoriesPass && forbiddenAbsent && noFindingsPass };
}

export async function evaluatePhotographyGoldenCases(cases = PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES) {
  let providerCalls = 0;
  const evaluatedCases = [];
  for (const testCase of cases) {
    const input = buildPhotographySemanticReviewInput(testCase);
    const deterministicFindings = buildPhotographyPreSendReview({ scope: input.scope, templateId: input.template.id });
    const provider = {
      async review() {
        providerCalls += 1;
        return testCase.mockSemanticResult;
      },
    };
    const result = await runPhotographySemanticReview({ input, provider, deterministicFindings });
    const checks = casePasses(testCase, result);
    evaluatedCases.push({ id: testCase.id, ...checks });
  }
  const promptInjection = evaluatedCases.find(({ id }) => id === 'CASE6-prompt-injection-treated-as-data');
  const clean = evaluatedCases.find(({ id }) => id === 'CASE7-commercial-clean-control');
  const negatives = evaluatedCases.filter(({ id }) => id === 'CASE2-wedding-duration-negative-control' || id === 'CASE7-commercial-clean-control');
  return {
    evalVersion: PHOTOGRAPHY_INTELLIGENCE_EVAL_VERSION,
    totalCases: evaluatedCases.length,
    passedCases: evaluatedCases.filter((item) => item.pass).length,
    failedCases: evaluatedCases.filter((item) => !item.pass).length,
    cleanNoFindingControlPass: Boolean(clean?.pass),
    promptInjectionGoldenCasePass: Boolean(promptInjection?.pass),
    negativeControlCasesPass: negatives.length === 2 && negatives.every((item) => item.pass),
    noRealProviderCall: providerCalls === evaluatedCases.length,
    cases: evaluatedCases,
  };
}

export { PHOTOGRAPHY_INTELLIGENCE_EVAL_VERSION };
