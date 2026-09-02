
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

export function createDeepSeekSemanticReviewProvider({ config = {}, fetchImpl = globalThis.fetch, timeoutMs = 12_000 } = {}) {
  return Object.freeze({
    providerId: 'deepseek',
    async review(request) {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new SemanticProviderError('DeepSeek is not configured', 'SEMANTIC_REVIEW_MISSING_API_KEY');
      if (typeof fetchImpl !== 'function') throw new SemanticProviderError('Server fetch is unavailable', 'SEMANTIC_REVIEW_FETCH_UNAVAILABLE');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${DEEPSEEK_API_BASE_URL}/chat/completions`, {
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
            max_tokens: 1800,
            stream: false,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const status = response.status || 0;
          throw new SemanticProviderError('DeepSeek request failed', status === 429 ? 'SEMANTIC_REVIEW_RATE_LIMITED' : 'SEMANTIC_REVIEW_PROVIDER_ERROR', { status, retryable: status === 429 || status >= 500 });
        }
        const payload = await response.json().catch(() => {
          throw new SemanticProviderError('DeepSeek returned invalid JSON', 'SEMANTIC_REVIEW_INVALID_TRANSPORT');
        });
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
        return parsed;
      } catch (error) {
        if (error?.name === 'AbortError') throw new SemanticProviderError('DeepSeek request timed out', 'SEMANTIC_REVIEW_TIMEOUT', { retryable: true });
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
  });
}
