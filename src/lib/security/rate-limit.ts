/**
 * A fixed-window limiter held in process memory.
 *
 * This is deliberately the small version: it protects a single instance and
 * resets on deploy. It does NOT hold across instances, so on more than one
 * replica the effective limit is the configured one times the replica count.
 * Moving the counters into PostgreSQL or Redis is the next step; until then
 * this still turns an unbounded six-digit code into a bounded one, which is
 * the difference that matters.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    /* Cheap bound on memory: a flood of distinct keys must not grow forever. */
    if (buckets.size >= MAX_TRACKED_KEYS) {
      for (const [candidate, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(candidate);
      }
      if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.count >= limit) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  existing.count += 1;
  return { ok: true };
}

/** Best-effort client identity behind a proxy; falls back to a shared bucket. */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `${scope}:${forwarded || real || "unknown"}`;
}

export function tooManyRequests(retryAfterSeconds: number) {
  return new Response(JSON.stringify({ error: "Zu viele Versuche. Bitte kurz warten." }), {
    status: 429,
    headers: { "content-type": "application/json", "retry-after": String(retryAfterSeconds) },
  });
}

/** Only for tests: the module keeps state between calls by design. */
export function resetRateLimits() {
  buckets.clear();
}
