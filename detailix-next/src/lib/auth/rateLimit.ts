/**
 * Limiteur de débit en mémoire (fenêtre fixe), pour les tentatives de connexion
 * et d'inscription.
 *
 * ⚠️ LIMITE CONNUE : ce compteur vit dans la mémoire du processus Node. Il est
 * remis à zéro à chaque redémarrage/redéploiement et N'EST PAS partagé entre
 * plusieurs instances serverless — un attaquant distribuant ses requêtes sur
 * plusieurs instances Vercel le contourne trivialement. Acceptable uniquement
 * pour un usage mono-instance (dev, test utilisateurs restreint). La vraie
 * solution de production est un compteur partagé (Upstash Redis +
 * @upstash/ratelimit), avec la même logique de clé (IP, IP+email).
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, opts: { max: number; windowMs: number }): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true };
  }

  if (existing.count >= opts.max) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true };
}

/** Purge périodique légère pour éviter une croissance non bornée de la Map en longue durée. */
let lastSweep = Date.now();
export function sweepRateLimitBuckets(): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
