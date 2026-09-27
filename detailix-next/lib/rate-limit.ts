// In-memory rate limiter — fits single-instance dev/prod. Replace with Redis for multi-node.
//
// Callers commonly build keys from the `x-forwarded-for` request header. That
// header is only trustworthy when a trusted reverse proxy (e.g. a load
// balancer or CDN) terminates client connections and overwrites/appends it
// itself — otherwise a direct client can set any value it wants and trivially
// get a fresh IP-based bucket on every request. Auth-related actions must
// therefore also rate-limit on a second, attacker-uncontrolled key (e.g. the
// normalized account email) so the IP-based limit alone is never the only
// line of defense.
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 5;

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

// Cleanup entries older than 2 windows every 5 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now - WINDOW_MS) store.delete(key);
  }
}, 5 * 60_000);
