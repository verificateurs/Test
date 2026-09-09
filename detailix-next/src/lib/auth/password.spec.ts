import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, isPasswordStrongEnough } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("un mot de passe correct est vérifié avec succès", async () => {
    const hash = await hashPassword("motdepasse-solide-123");
    await expect(verifyPassword("motdepasse-solide-123", hash)).resolves.toBe(true);
  });

  it("un mot de passe incorrect est rejeté", async () => {
    const hash = await hashPassword("motdepasse-solide-123");
    await expect(verifyPassword("mauvais-mot-de-passe", hash)).resolves.toBe(false);
  });

  it("deux hachages du même mot de passe diffèrent (sel aléatoire)", async () => {
    const a = await hashPassword("motdepasse-solide-123");
    const b = await hashPassword("motdepasse-solide-123");
    expect(a).not.toBe(b);
  });

  it("le format stocké est versionné scrypt$N$r$p$sel$hash", async () => {
    const hash = await hashPassword("motdepasse-solide-123");
    expect(hash.split("$")).toHaveLength(6);
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("un hash stocké malformé est rejeté sans lever d'exception", async () => {
    await expect(verifyPassword("peu importe", "pas-un-hash-valide")).resolves.toBe(false);
    await expect(verifyPassword("peu importe", "scrypt$abc$def")).resolves.toBe(false);
    await expect(verifyPassword("peu importe", "bcrypt$32768$8$1$aa$bb")).resolves.toBe(false);
  });
});

describe("isPasswordStrongEnough", () => {
  it("accepte un mot de passe de 10 caractères ou plus", () => {
    expect(isPasswordStrongEnough("1234567890")).toBe(true);
  });

  it("refuse un mot de passe de moins de 10 caractères", () => {
    expect(isPasswordStrongEnough("court123")).toBe(false);
  });

  it("refuse une valeur non-string", () => {
    expect(isPasswordStrongEnough(undefined as unknown as string)).toBe(false);
  });
});
