
import { DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS } from '../semanticReviewTimeout.js';

export const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com';

export class SemanticProviderError extends Error {
  constructor(message, code, { status = 0, retryable = false } = {}) {
    super(message);
    this.name = 'SemanticProviderError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

function extractContent(payload) {
  return payload?.choices?.[0]?.message?.content;
}

function createTimeoutError() {
  return new SemanticProviderError('DeepSeek request timed out', 'SEMANTIC_REVIEW_TIMEOUT', { retryable: true });
}

function isTimeoutAbort(error, controller, timedOut) {
  return timedOut || (controller.signal.aborted && error?.name === 'AbortError');
}

function addSafeNumber(target, key, value) {
  if (Number.isSafeInteger(value) && value >= 0) target[key] = value;
}

function notifyTelemetry({ onTelemetry, config, response, payload, latencyMs, success, errorCode }) {
  if (typeof onTelemetry !== 'function') return;
  try {
    const telemetry = {
      provider: 'deepseek',
      model: config.model,
      status: response?.status || 0,
      latencyMs,
      success,
    };
    const requestId = typeof response?.headers?.get === 'function'
      ? response.headers.get('x-request-id') || response.headers.get('request-id')
      : null;
    if (typeof requestId === 'string' && requestId.trim()) telemetry.requestId = requestId;
    if (!success) telemetry.errorCode = errorCode || 'SEMANTIC_REVIEW_PROVIDER_ERROR';

    const usage = payload?.usage;
    if (usage && typeof usage === 'object') {
      addSafeNumber(telemetry, 'promptTokens', usage.prompt_tokens);
      addSafeNumber(telemetry, 'completionTokens', usage.completion_tokens);
      addSafeNumber(telemetry, 'totalTokens', usage.total_tokens);
      addSafeNumber(telemetry, 'cacheHitTokens', usage.prompt_cache_hit_tokens);
      addSafeNumber(telemetry, 'cacheMissTokens', usage.prompt_cache_miss_tokens);
    }

    Promise.resolve(onTelemetry(Object.freeze(telemetry))).catch(() => {});
  } catch (_) {
    // Telemetry is observational and must never affect the provider result.
  }
}

export function createDeepSeekSemanticReviewProvider({ config = {}, fetchImpl = globalThis.fetch, timeoutMs = config.timeoutMs ?? DEFAULT_SEMANTIC_REVIEW_TIMEOUT_MS, onTelemetry } = {}) {
  return Object.freeze({
    providerId: 'deepseek',
    async review(request) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new SemanticProviderError('DeepSeek is not configured', 'SEMANTIC_REVIEW_MISSING_API_KEY');
      if (typeof fetchImpl !== 'function') throw new SemanticProviderError('Server fetch is unavailable', 'SEMANTIC_REVIEW_FETCH_UNAVAILABLE');

      const controller = new AbortController();
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      const startedAt = Date.now();
      let response;
      let payload;
      try {
        response = await fetchImpl(`${DEEPSEEK_API_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: request.systemInstruction },
              { role: 'user', content: JSON.stringify(request.input) },
            ],
            response_format: { type: 'json_object' },
            thinking: { type: 'enabled' },
            reasoning_effort: config.reasoningEffort,
            max_tokens: 4096,
            stream: false,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const status = response.status || 0;
          throw new SemanticProviderError('DeepSeek request failed', status === 429 ? 'SEMANTIC_REVIEW_RATE_LIMITED' : 'SEMANTIC_REVIEW_PROVIDER_ERROR', { status, retryable: status === 429 || status >= 500 });
        }
        try {
          payload = await response.json();
        } catch (error) {
          if (isTimeoutAbort(error, controller, timedOut)) throw createTimeoutError();
          throw new SemanticProviderError('DeepSeek returned invalid JSON', 'SEMANTIC_REVIEW_INVALID_TRANSPORT');
        }
        const choice = payload?.choices?.[0];
        if (choice?.finish_reason === 'length') throw new SemanticProviderError('DeepSeek response was truncated', 'SEMANTIC_REVIEW_TRUNCATED');
        const content = extractContent(payload);
        if (typeof content !== 'string' || !content.trim()) throw new SemanticProviderError('DeepSeek returned empty content', 'SEMANTIC_REVIEW_EMPTY_RESPONSE');
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          throw new SemanticProviderError('DeepSeek returned malformed semantic JSON', 'SEMANTIC_REVIEW_INVALID_JSON');
        }
        notifyTelemetry({ onTelemetry, config, response, payload, latencyMs: Date.now() - startedAt, success: true });
        return parsed;
      } catch (error) {
        const normalizedError = isTimeoutAbort(error, controller, timedOut) ? createTimeoutError() : error;
        notifyTelemetry({ onTelemetry, config, response, payload, latencyMs: Date.now() - startedAt, success: false, errorCode: normalizedError?.code });
        throw normalizedError;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}
