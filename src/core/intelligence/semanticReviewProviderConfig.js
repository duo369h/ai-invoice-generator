import { parseSemanticReviewTimeoutMs, DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS } from './semanticReviewTimeout.js';

export const DEFAULT_SEMANTIC_REVIEW_PROVIDER = 'deepseek';
export const DEFAULT_SEMANTIC_REVIEW_MODEL = 'deepseek-v4-flash';
export const DEFAULT_SEMANTIC_REVIEW_REASONING_EFFORT = 'low';
export { DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS };

export function getSemanticReviewRuntimeConfig(env = process.env) {
  return Object.freeze({
    provider: String(env.CORVIOZ_INTELLIGENCE_PROVIDER || DEFAULT_SEMANTIC_REVIEW_PROVIDER).trim().toLowerCase(),
    model: String(env.CORVIOZ_INTELLIGENCE_MODEL || DEFAULT_SEMANTIC_REVIEW_MODEL).trim(),
    reasoningEffort: ['low', 'high', 'max'].includes(env.CORVIOZ_INTELLIGENCE_REASONING_EFFORT)
      ? env.CORVIOZ_INTELLIGENCE_REASONING_EFFORT
      : DEFAULT_SEMANTIC_REVIEW_REASONING_EFFORT,
    timeoutMs: parseSemanticReviewTimeoutMs(env.CORVIOZ_INTELLIGENCE_TIMEOUT_MS),
    apiKeyPresent: Boolean(env.DEEPSEEK_API_KEY),
  });
}

export function getSemanticReviewProvider({ config = getSemanticReviewRuntimeConfig(), fetchImpl = globalThis.fetch, onTelemetry } = {}) {
  if (config.provider !== 'deepseek') {
    const error = new Error(`Unsupported semantic review provider: ${config.provider}`);
    error.code = 'SEMANTIC_REVIEW_PROVIDER_UNSUPPORTED';
    throw error;
  }
  return createDeepSeekSemanticReviewProvider({ config, fetchImpl, onTelemetry });
}

import { createDeepSeekSemanticReviewProvider } from './providers/deepSeekSemanticReviewProvider.js';
