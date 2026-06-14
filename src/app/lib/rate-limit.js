const ipCache = new Map();

/**
 * Lightweight in-memory rate limiter.
 * @param {string} ip - The requester's IP address.
 * @param {number} limit - Max number of requests allowed in the window.
 * @param {number} windowMs - Time window in milliseconds.
 * @returns {object} { success: boolean, limit: number, remaining: number }
 */
export function rateLimit(ip, limit = 60, windowMs = 60000) {
  const now = Date.now();
  if (!ipCache.has(ip)) {
    ipCache.set(ip, []);
  }

  const requests = ipCache.get(ip).filter(timestamp => now - timestamp < windowMs);
  requests.push(now);
  ipCache.set(ip, requests);

  const success = requests.length <= limit;
  return {
    success,
    limit,
    remaining: Math.max(0, limit - requests.length),
    reset: now + windowMs
  };
}
