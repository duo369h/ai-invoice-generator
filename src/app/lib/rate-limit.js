const memoryCache = new Map();

const RATE_LIMITS = {
  leadSubmit: { limit: 5, windowMs: 60_000 },
  portalComment: { limit: 10, windowMs: 60_000 },
  invoiceApi: { limit: 60, windowMs: 60_000 },
  aiParse: { limit: 20, windowMs: 60_000 },
  quoteGenerate: { limit: 20, windowMs: 60_000 }
};

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

async function upstashCommand(config, command) {
  const response = await fetch(`${config.url}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${config.token}` },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed: ${response.status}`);
  }

  return response.json();
}

async function redisFixedWindow(key, limit, windowMs) {
  const config = getUpstashConfig();
  if (!config) {
    if (process.env.NODE_ENV === 'production') {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: Date.now() + windowMs,
        status: 503,
        error: 'Rate limiter is not configured'
      };
    }
    return memoryRateLimit(key, limit, windowMs);
  }

  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `rl:${key}:${bucket}`;
  const increment = await upstashCommand(config, ['INCR', redisKey]);
  const count = Number(increment.result || 0);

  if (count === 1) {
    await upstashCommand(config, ['PEXPIRE', redisKey, String(windowMs)]);
  }

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset: (bucket + 1) * windowMs
  };
}

function memoryRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const requests = (memoryCache.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  requests.push(now);
  memoryCache.set(key, requests);

  return {
    success: requests.length <= limit,
    limit,
    remaining: Math.max(0, limit - requests.length),
    reset: now + windowMs
  };
}

export async function rateLimit(key, limit = 60, windowMs = 60_000) {
  return redisFixedWindow(key, limit, windowMs);
}

export async function rateLimitByPolicy(policy, identifier) {
  const config = RATE_LIMITS[policy] || RATE_LIMITS.invoiceApi;
  return rateLimit(`${policy}:${identifier || 'anonymous'}`, config.limit, config.windowMs);
}
