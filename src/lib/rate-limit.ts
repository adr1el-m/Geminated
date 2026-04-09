/**
 * In-process rate limiter using a module-level Map.
 *
 * WARNING — Serverless / edge deployments:
 * Each serverless function invocation (Vercel Functions, AWS Lambda, etc.)
 * may run in a separate process with an empty store. This means the limiter
 * provides best-effort protection in those environments but is NOT guaranteed
 * to enforce limits across concurrent or distributed invocations.
 *
 * For strict distributed rate limiting, replace this module with a Redis-backed
 * implementation, e.g. using Upstash Redis with the @upstash/ratelimit library.
 *
 * In long-lived Node.js server deployments (e.g. Docker / standalone Next.js)
 * this limiter is fully effective as the process remains resident.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  key: string;
  windowMs: number;
  maxRequests: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

const STORE_KEY = '__geminated_rate_limit_store__';

function getStore() {
  const globalObject = globalThis as typeof globalThis & {
    [STORE_KEY]?: Map<string, Bucket>;
  };

  if (!globalObject[STORE_KEY]) {
    globalObject[STORE_KEY] = new Map<string, Bucket>();
  }

  return globalObject[STORE_KEY];
}

function cleanupExpiredEntries(now: number, store: Map<string, Bucket>) {
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const store = getStore();

  // Keep in-memory limiter bounded in long-lived processes.
  if (store.size > 5000) {
    cleanupExpiredEntries(now, store);
  }

  const existing = store.get(config.key);

  if (!existing || existing.resetAt <= now) {
    store.set(config.key, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, config.maxRequests - 1),
    };
  }

  if (existing.count >= config.maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  store.set(config.key, existing);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remaining: Math.max(0, config.maxRequests - existing.count),
  };
}
