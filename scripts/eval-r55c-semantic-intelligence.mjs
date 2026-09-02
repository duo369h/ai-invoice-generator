import { evaluatePhotographyGoldenCases } from '../src/core/intelligence/photographyIntelligenceEvaluation.js';

const result = await evaluatePhotographyGoldenCases();
console.log(`R55C EVAL VERSION: ${result.evalVersion}`);
console.log(`R55C EVAL CASES: ${result.passedCases}/${result.totalCases} PASS`);
console.log(`R55C EVAL NEGATIVE_CONTROLS: ${result.negativeControlCasesPass ? 'PASS' : 'FAIL'}`);
console.log(`R55C EVAL PROMPT_INJECTION: ${result.promptInjectionGoldenCasePass ? 'PASS' : 'FAIL'}`);
console.log(`R55C EVAL NO_REAL_PROVIDER_CALL: ${result.noRealProviderCall ? 'YES' : 'NO'}`);
if (result.failedCases > 0 || !result.cleanNoFindingControlPass || !result.promptInjectionGoldenCasePass || !result.negativeControlCasesPass || !result.noRealProviderCall) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
}
