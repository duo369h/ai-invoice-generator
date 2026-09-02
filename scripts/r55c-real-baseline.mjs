import { buildPhotographyPreSendReview } from '../src/core/quotes/photographyQuoteReview.js';
import { buildPhotographySemanticReviewInput, runPhotographySemanticReview } from '../src/core/intelligence/photographySemanticReview.js';
import { PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES } from '../src/core/intelligence/photographyIntelligenceGoldenCases.js';
import { evaluatePhotographySemanticCase } from '../src/core/intelligence/photographyIntelligenceEvaluation.js';
import { getSemanticReviewProvider, getSemanticReviewRuntimeConfig } from '../src/core/intelligence/semanticReviewProviderConfig.js';

export const R55C_REAL_BASELINE_CALL_CAP = 14;

function classifyProviderResult(result, telemetry) {
  if (!result) return 'NOT_EVALUATED';
  if (result.status === 'COMPLETE') return 'COMPLETE';
  const code = telemetry.errorCode || result.errorCode || '';
  if (code === 'SEMANTIC_REVIEW_TRUNCATED') return 'TRUNCATED';
  if (code === 'SEMANTIC_REVIEW_TIMEOUT') return 'TIMEOUT';
  if (code === 'SEMANTIC_REVIEW_INVALID_TRANSPORT') return 'INVALID_TRANSPORT';
  if (code === 'SEMANTIC_REVIEW_INVALID_JSON' || code === 'SEMANTIC_REVIEW_INVALID_RESULT') return 'INVALID_SEMANTIC_JSON';
  if (code === 'SEMANTIC_REVIEW_EMPTY_RESPONSE') return 'EMPTY_RESPONSE';
  if ((telemetry.status || 0) > 0) return 'HTTP_ERROR';
  return code.includes('TIMEOUT') ? 'TIMEOUT' : 'NETWORK_ERROR';
}

function emptySafety() {
  return {
    priceInvention: 'NOT_EVALUATED',
    legalInvention: 'NOT_EVALUATED',
    unsafeInference: 'NOT_EVALUATED',
    materialFalsePositive: 'NOT_EVALUATED',
    authoritativeFactAutoChange: 'NOT_EVALUATED',
    promptInjectionIgnored: 'NOT_EVALUATED',
    promptInjectionSurfaced: 'NOT_EVALUATED',
    promptInjectionObeyed: 'NOT_APPLICABLE',
    systemAuthorityLeak: 'NOT_EVALUATED',
    caseForbiddenViolation: 'NOT_EVALUATED',
    categoryPreferenceMatch: 'NOT_EVALUATED',
  };
}

function summary(findings) {
  return findings.map((finding) => `${finding.category}: ${String(finding.title || '').replace(/\s+/g, ' ').trim().slice(0, 180)}`).join(' | ') || 'NONE';
}

export async function runR55CBaseline({
  cases = PHOTOGRAPHY_INTELLIGENCE_GOLDEN_CASES,
  passes = ['A', 'B'],
  callCap = R55C_REAL_BASELINE_CALL_CAP,
  providerFactory = ({ config, onTelemetry }) => getSemanticReviewProvider({ config, onTelemetry }),
  onRecord,
} = {}) {
  const scheduled = cases.length * passes.length;
  if (scheduled > callCap) throw new Error(`R55C call cap exceeded: ${scheduled} > ${callCap}`);
  const config = getSemanticReviewRuntimeConfig();
  const records = [];
  let callNumber = 0;
  for (const pass of passes) {
    for (const testCase of cases) {
      callNumber += 1;
      const telemetry = {};
      let providerResult = 'NOT_EVALUATED';
      let semanticResult = 'NOT_EVALUATED';
      let harnessResult = 'PASS';
      let result = null;
      let findings = [];
      let deterministicFindings = [];
      let input;
      let lifecycleMs = null;
      let semanticCallAttempted = 'NO';
      try {
        const started = Date.now();
        input = buildPhotographySemanticReviewInput(testCase);
        deterministicFindings = buildPhotographyPreSendReview({ scope: input.scope, templateId: input.template.id });
        const provider = await providerFactory({
          config,
          pass,
          testCase,
          callNumber,
          onTelemetry: (event) => {
            for (const key of ['status', 'latencyMs', 'promptTokens', 'completionTokens', 'totalTokens', 'cacheHitTokens', 'cacheMissTokens', 'requestId', 'errorCode']) {
              if (Object.prototype.hasOwnProperty.call(event || {}, key)) telemetry[key] = event[key];
            }
          },
        });
        semanticCallAttempted = 'YES';
        result = await runPhotographySemanticReview({ input, provider, deterministicFindings });
        lifecycleMs = Date.now() - started;
        providerResult = classifyProviderResult(result, telemetry);
        if (providerResult === 'COMPLETE') {
          findings = Array.isArray(result.semanticFindings) ? result.semanticFindings : [];
          try {
            const evaluated = evaluatePhotographySemanticCase(testCase, findings);
            semanticResult = evaluated.semanticResult;
          } catch (_) {
            harnessResult = 'EVALUATOR_ERROR';
          }
        }
      } catch (_) {
        harnessResult = 'OTHER_HARNESS_ERROR';
      }
      const evaluated = providerResult === 'COMPLETE' && harnessResult !== 'EVALUATOR_ERROR'
        ? evaluatePhotographySemanticCase(testCase, findings)
        : null;
      const productFindings = providerResult === 'COMPLETE' && Array.isArray(result?.findings) ? result.findings : [];
      const record = {
        pass,
        caseId: testCase.id,
        providerResult,
        harnessResult,
        semanticCallAttempted,
        httpStatus: telemetry.status > 0 ? telemetry.status : 'NOT_AVAILABLE',
        latencyMs: lifecycleMs ?? 'NOT_AVAILABLE',
        promptTokens: Number.isSafeInteger(telemetry.promptTokens) ? telemetry.promptTokens : 'NOT_AVAILABLE',
        completionTokens: Number.isSafeInteger(telemetry.completionTokens) ? telemetry.completionTokens : 'NOT_AVAILABLE',
        totalTokens: Number.isSafeInteger(telemetry.totalTokens) ? telemetry.totalTokens : 'NOT_AVAILABLE',
        cacheHitTokens: Number.isSafeInteger(telemetry.cacheHitTokens) ? telemetry.cacheHitTokens : 'NOT_AVAILABLE',
        cacheMissTokens: Number.isSafeInteger(telemetry.cacheMissTokens) ? telemetry.cacheMissTokens : 'NOT_AVAILABLE',
        providerRequestId: telemetry.requestId || 'NOT_AVAILABLE',
        semanticResult,
        semanticCorrectness: semanticResult,
        deterministicFindingsPath: input ? 'COMMITTED_BUILD_PHOTOGRAPHY_PRE_SEND_REVIEW' : 'NOT_EVALUATED',
        deterministicFindingCount: input ? deterministicFindings.length : 'NOT_AVAILABLE',
        semanticFindingCount: providerResult === 'COMPLETE' ? findings.length : 'NOT_AVAILABLE',
        semanticFindingCategories: providerResult === 'COMPLETE' ? [...new Set(findings.map((finding) => finding.category))].join(',') || 'NONE' : 'NOT_AVAILABLE',
        semanticFindingSummary: providerResult === 'COMPLETE' ? summary(findings) : 'NOT_EVALUATED',
        finalFindingCount: providerResult === 'COMPLETE' ? productFindings.length : 'NOT_AVAILABLE',
        finalFindingCategories: providerResult === 'COMPLETE' ? [...new Set(productFindings.map((finding) => finding.category))].join(',') || 'NONE' : 'NOT_AVAILABLE',
        finalFindingSummary: providerResult === 'COMPLETE' ? summary(productFindings) : 'NOT_EVALUATED',
        ...(evaluated || emptySafety()),
      };
      records.push(record);
      try {
        if (typeof onRecord === 'function') await onRecord(record);
      } catch (_) {
        record.harnessResult = 'REPORTER_ERROR';
      }
    }
  }
  const count = (field, value) => records.filter((record) => record[field] === value).length;
  return {
    callCap,
    totalScheduled: scheduled,
    totalExecuted: records.length,
    recordCount: records.length,
    semanticCallsAttempted: records.filter((record) => record.semanticCallAttempted === 'YES').length,
    records,
    providerCompleteCount: count('providerResult', 'COMPLETE'),
    providerTruncatedCount: count('providerResult', 'TRUNCATED'),
    providerTimeoutCount: count('providerResult', 'TIMEOUT'),
    providerNetworkErrorCount: count('providerResult', 'NETWORK_ERROR'),
    providerHttpErrorCount: count('providerResult', 'HTTP_ERROR'),
    providerInvalidTransportCount: count('providerResult', 'INVALID_TRANSPORT'),
    providerInvalidSemanticJsonCount: count('providerResult', 'INVALID_SEMANTIC_JSON'),
    providerEmptyResponseCount: count('providerResult', 'EMPTY_RESPONSE'),
    providerOtherFailureCount: count('providerResult', 'OTHER_PROVIDER_FAILURE'),
    semanticPassCount: count('semanticResult', 'PASS'),
    semanticFailCount: count('semanticResult', 'FAIL'),
    semanticNotEvaluatedCount: count('semanticResult', 'NOT_EVALUATED'),
    criticalQualityFailureCount: count('criticalFailure', 'YES'),
    priceInventionCount: count('priceInvention', 'YES'),
    legalInventionCount: count('legalInvention', 'YES'),
    unsafeInferenceCount: count('unsafeInference', 'YES'),
    materialFalsePositiveCount: count('materialFalsePositive', 'YES'),
    promptInjectionFailureCount: records.filter((record) => record.caseId === 'CASE6-prompt-injection-treated-as-data'
      && record.providerResult === 'COMPLETE'
      && record.harnessResult === 'PASS'
      && (record.semanticResult === 'PASS' || record.semanticResult === 'FAIL')
      && (record.promptInjectionIgnored !== 'YES' || record.promptInjectionSurfaced !== 'YES')).length,
    harnessErrorCount: records.filter((record) => record.harnessResult !== 'PASS').length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes('--dry-run');
  const realRun = process.argv.includes('--real');
  if (!dryRun && !realRun) {
    console.error('Use --dry-run for local stubs or --real for the authorized 14-call baseline.');
    process.exitCode = 2;
  } else {
    const result = await runR55CBaseline({
      providerFactory: dryRun
        ? ({ testCase }) => ({ review: async () => testCase.mockSemanticResult })
        : undefined,
    });
    console.log(JSON.stringify(result, null, 2));
  }
}
