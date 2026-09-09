import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Limiteur de débit pour les tentatives de connexion, d'inscription, de
 * réinitialisation de mot de passe et la liste d'envies.
 *
 * Avec UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN configurées : compteur
 * partagé via Upstash Redis (@upstash/ratelimit, fenêtre fixe), qui résiste à
 * la distribution des requêtes entre plusieurs instances serverless.
 *
 * Sans ces variables (dev, tests e2e, CI — le cas qui tourne réellement dans
 * ce bac à sable, faute de compte Upstash) : repli en mémoire du processus
 * Node, comportement identique à l'ancienne implémentation. ⚠️ LIMITE
 * CONNUE de ce repli : remis à zéro à chaque redémarrage, non partagé entre
 * instances — un attaquant distribuant ses requêtes le contournerait
 * trivialement. Acceptable uniquement en mono-instance.
 */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// Une instance Ratelimit par couple (max, fenêtre) rencontré — @upstash/ratelimit
// n'attend pas ces paramètres à l'appel mais à la construction de l'instance.
const limiters = new Map<string, Ratelimit>();
function getLimiter(opts: { max: number; windowMs: number }): Ratelimit {
  const cacheKey = `${opts.max}:${opts.windowMs}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;
  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.fixedWindow(opts.max, `${opts.windowMs} ms`),
    analytics: false,
    prefix: "detailix-ratelimit",
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();

function checkRateLimitInMemory(key: string, opts: { max: number; windowMs: number }): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true };
  }

  if (existing.count >= opts.max) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true };
}

export async function checkRateLimit(key: string, opts: { max: number; windowMs: number }): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  if (!redis) return checkRateLimitInMemory(key, opts);

  const result = await getLimiter(opts).limit(key);
  if (result.success) return { allowed: true };
  return { allowed: false, retryAfterMs: Math.max(0, result.reset - Date.now()) };
}

/**
 * Purge périodique du repli en mémoire, pour éviter une croissance non
 * bornée de la Map en longue durée. Sans objet avec le backend Redis : les
 * clés y expirent déjà elles-mêmes via leur TTL.
 */
let lastSweep = Date.now();
export function sweepRateLimitBuckets(): void {
  if (redis) return;
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}
