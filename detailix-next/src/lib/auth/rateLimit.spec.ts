import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rateLimit";

// Aucune variable UPSTASH_REDIS_REST_* dans l'environnement de test : ces
// tests exercent donc le repli en mémoire (voir rateLimit.ts). Le
// comportement du backend Redis n'est pas testable ici sans compte Upstash
// réel — @upstash/ratelimit fait foi côté bibliothèque pour cette partie.

describe("checkRateLimit (repli en mémoire)", () => {
  it("autorise jusqu'à max tentatives puis bloque la suivante", async () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const result = await checkRateLimit(key, { max: 3, windowMs: 60_000 });
      expect(result.allowed).toBe(true);
    }
    const blocked = await checkRateLimit(key, { max: 3, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("des clés distinctes ont des compteurs indépendants", async () => {
    const keyA = `test:a:${Math.random()}`;
    const keyB = `test:b:${Math.random()}`;
    await checkRateLimit(keyA, { max: 1, windowMs: 60_000 });
    const blockedA = await checkRateLimit(keyA, { max: 1, windowMs: 60_000 });
    const allowedB = await checkRateLimit(keyB, { max: 1, windowMs: 60_000 });
    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  it("la fenêtre expirée réautorise les tentatives suivantes", async () => {
    const key = `test:window:${Math.random()}`;
    await checkRateLimit(key, { max: 1, windowMs: 20 });
    const blocked = await checkRateLimit(key, { max: 1, windowMs: 20 });
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));
    const allowedAgain = await checkRateLimit(key, { max: 1, windowMs: 20 });
    expect(allowedAgain.allowed).toBe(true);
  });
});
