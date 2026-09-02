import assert from 'node:assert/strict';

import {
  createDeepSeekSemanticReviewProvider,
} from '../src/core/intelligence/providers/deepSeekSemanticReviewProvider.js';
import {
  DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS,
  getSemanticReviewRuntimeConfig,
} from '../src/core/intelligence/semanticReviewProviderConfig.js';

const request = {
  systemInstruction: 'test-only system instruction',
  input: { publicNotes: 'test-only input' },
};

const abortError = () => {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
};

const providerResponse = (payload, { status = 200, json = null, headers = {} } = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  clone() {
    throw new Error('telemetry must not clone the provider response');
  },
  headers: { get: (name) => headers[name.toLowerCase()] || null },
  async json() {
    if (json) return json();
    return payload;
  },
});

const providerWith = ({ fetchImpl, timeoutMs = 20, onTelemetry } = {}) => createDeepSeekSemanticReviewProvider({
  config: { model: 'deepseek-v4-flash', reasoningEffort: 'low' },
  fetchImpl,
  timeoutMs,
  onTelemetry,
});

const expectCode = async (promise, code) => {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code);
    return true;
  });
};

const originalKey = process.env.DEEPSEEK_API_KEY;
process.env.DEEPSEEK_API_KEY = 'test-only-not-real';

try {
  await expectCode(
    providerWith({
      fetchImpl: async (_url, { signal }) => new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(abortError()), { once: true });
      }),
    }).review(request),
    'SEMANTIC_REVIEW_TIMEOUT',
  );

  await expectCode(
    providerWith({
      fetchImpl: async (_url, { signal }) => providerResponse(null, {
        json: () => new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => reject(abortError()), { once: true });
        }),
      }),
    }).review(request),
    'SEMANTIC_REVIEW_TIMEOUT',
  );

  await expectCode(
    providerWith({ fetchImpl: async () => providerResponse(null, { json: () => { throw new SyntaxError('bad JSON'); } }) }).review(request),
    'SEMANTIC_REVIEW_INVALID_TRANSPORT',
  );

  await expectCode(
    providerWith({ fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'stop', message: { content: '{' } }] }) }).review(request),
    'SEMANTIC_REVIEW_INVALID_JSON',
  );

  for (const content of ['', null, '   ']) {
    await expectCode(
      providerWith({ fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'stop', message: { content } }] }) }).review(request),
      'SEMANTIC_REVIEW_EMPTY_RESPONSE',
    );
  }

  await expectCode(
    providerWith({ fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'length', message: { content: '{' } }] }) }).review(request),
    'SEMANTIC_REVIEW_TRUNCATED',
  );

  assert.equal(DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS, 30_000);
  assert.equal(getSemanticReviewRuntimeConfig({}).timeoutMs, 30_000);
  assert.equal(getSemanticReviewRuntimeConfig({ CORVIOZ_INTELLIGENCE_TIMEOUT_MS: '45000' }).timeoutMs, 45_000);
  for (const value of ['4999', '60001', 'invalid', '']) {
    assert.equal(getSemanticReviewRuntimeConfig({ CORVIOZ_INTELLIGENCE_TIMEOUT_MS: value }).timeoutMs, 30_000);
  }

  const telemetry = [];
  let bodyReads = 0;
  const result = await providerWith({
    timeoutMs: 100,
    onTelemetry: (event) => telemetry.push(event),
    fetchImpl: async () => providerResponse({
      id: 'provider-response-body-must-not-be-telemetry',
      choices: [{ finish_reason: 'stop', message: { content: '{"findings":[]}' } }],
      usage: {
        prompt_tokens: 11,
        completion_tokens: 7,
        total_tokens: 18,
        prompt_cache_hit_tokens: 3,
        prompt_cache_miss_tokens: 8,
      },
    }, {
      headers: { 'x-request-id': 'request-id-safe-metadata' },
      json: async () => {
        bodyReads += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return {
          id: 'provider-response-body-must-not-be-telemetry',
          choices: [{ finish_reason: 'stop', message: { content: '{"findings":[]}' } }],
          usage: {
            prompt_tokens: 11,
            completion_tokens: 7,
            total_tokens: 18,
            prompt_cache_hit_tokens: 3,
            prompt_cache_miss_tokens: 8,
          },
        };
      },
    }),
  }).review(request);
  assert.deepEqual(result, { findings: [] });
  assert.equal(bodyReads, 1);
  assert.equal(telemetry.length, 1);
  const { latencyMs, ...telemetryWithoutLatency } = telemetry[0];
  assert.deepEqual(telemetryWithoutLatency, {
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    status: 200,
    success: true,
    requestId: 'request-id-safe-metadata',
    promptTokens: 11,
    completionTokens: 7,
    totalTokens: 18,
    cacheHitTokens: 3,
    cacheMissTokens: 8,
  });
  assert.equal(typeof latencyMs, 'number');
  assert.ok(latencyMs >= 20);
  assert.doesNotMatch(JSON.stringify(telemetry[0]), /provider-response-body|test-only system|test-only input|content|reasoning_content|apiKey|authorization|messages|input|rawBody/i);

  const telemetryFailureResult = await providerWith({
    onTelemetry: async () => { throw new Error('telemetry must not block review'); },
    fetchImpl: async () => providerResponse({ choices: [{ finish_reason: 'stop', message: { content: '{"findings":[]}' } }] }),
  }).review(request);
  assert.deepEqual(telemetryFailureResult, { findings: [] });

  console.log('R55C FIX-2 TRANSPORT, CONFIG, AND TELEMETRY TESTS: PASS');
} finally {
  if (originalKey) process.env.DEEPSEEK_API_KEY = originalKey;
  else delete process.env.DEEPSEEK_API_KEY;
}
