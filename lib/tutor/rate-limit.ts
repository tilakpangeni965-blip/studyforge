type RateLimiter = {
  ok: boolean;
  limit?: number;
  remaining?: number;
  resetInMs?: number;
};

type RateLimiterEntry = { count: number; resetAt: number };
type RateLimitRpcClient = {
  rpc: (name: "consume_tutor_request_limit") => Promise<{
    data: Array<{ allowed: boolean; remaining: number; reset_in_ms: number }> | null;
    error: { message: string } | null;
  }>;
};

const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;
const memoryBuckets = new Map<string, RateLimiterEntry>();

function memoryFallback(userId: string): RateLimiter {
  const now = Date.now();
  const entry = memoryBuckets.get(userId);
  if (!entry || entry.resetAt <= now) {
    memoryBuckets.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (memoryBuckets.size > 1000) {
      for (const [key, bucket] of memoryBuckets) {
        if (bucket.resetAt <= now) memoryBuckets.delete(key);
      }
    }
    return { ok: true, limit: RATE_LIMIT, remaining: RATE_LIMIT - 1, resetInMs: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { ok: false, limit: RATE_LIMIT, remaining: 0, resetInMs: Math.max(0, entry.resetAt - now) };
  }

  entry.count += 1;
  return { ok: true, limit: RATE_LIMIT, remaining: RATE_LIMIT - entry.count, resetInMs: Math.max(0, entry.resetAt - now) };
}

/** Uses a shared Postgres counter; falls back to a per-process limit if the migration is unavailable. */
export async function checkTutorRateLimit(client: unknown, userId: string): Promise<RateLimiter> {
  const rpcClient = client as RateLimitRpcClient;
  try {
    const { data, error } = await rpcClient.rpc("consume_tutor_request_limit");
    const result = data?.[0];
    if (!error && result) {
      return {
        ok: result.allowed,
        limit: RATE_LIMIT,
        remaining: result.remaining,
        resetInMs: Number(result.reset_in_ms),
      };
    }
    console.error("[tutor] shared rate limiter unavailable; using per-process fallback", error?.message ?? "empty RPC result");
  } catch (error) {
    console.error("[tutor] shared rate limiter failed; using per-process fallback", error);
  }
  return memoryFallback(userId);
}
