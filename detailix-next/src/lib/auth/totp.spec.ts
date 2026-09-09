import { describe, it, expect } from "vitest";
import { generateTotpSecret, generateTotpCode, verifyTotpCode, totpUri } from "./totp";

// Vecteur de test RFC 6238 Appendix B (mode SHA1), secret ASCII
// "12345678901234567890" (20 octets), encodé en base32 :
// "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" (calculé indépendamment de ce fichier).
// Pour T=59s, la RFC donne le code à 8 chiffres 94287082. Notre implémentation
// produit 6 chiffres = (valeur_31_bits mod 10^6), qui est arithmétiquement les
// 6 derniers chiffres du code à 8 chiffres (10^6 divise 10^8) : "287082".
const RFC_SECRET_BASE32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp", () => {
  it("produit le code à 6 chiffres attendu pour le vecteur de test RFC 6238 (T=59s)", () => {
    expect(generateTotpCode(RFC_SECRET_BASE32, 59_000)).toBe("287082");
  });

  it("produit le code attendu pour un second vecteur RFC 6238 (T=1111111109s → …081804)", () => {
    // RFC 6238 : code 8 chiffres 07081804 → 6 derniers chiffres "081804".
    expect(generateTotpCode(RFC_SECRET_BASE32, 1_111_111_109_000)).toBe("081804");
  });

  it("vérifie un code valide au pas de temps courant", () => {
    expect(verifyTotpCode(RFC_SECRET_BASE32, "287082", 59_000)).toBe(true);
  });

  it("accepte un code du pas de temps précédent ou suivant (tolérance ±30s)", () => {
    const t = 1_111_111_109_000; // milieu d'un pas de 30s
    const code = generateTotpCode(RFC_SECRET_BASE32, t);
    expect(verifyTotpCode(RFC_SECRET_BASE32, code, t + 30_000)).toBe(true);
    expect(verifyTotpCode(RFC_SECRET_BASE32, code, t - 30_000)).toBe(true);
  });

  it("rejette un code en dehors de la fenêtre de tolérance (±2 pas)", () => {
    const t = 1_111_111_109_000;
    const code = generateTotpCode(RFC_SECRET_BASE32, t);
    expect(verifyTotpCode(RFC_SECRET_BASE32, code, t + 90_000)).toBe(false);
    expect(verifyTotpCode(RFC_SECRET_BASE32, code, t - 90_000)).toBe(false);
  });

  it("rejette un code malformé sans même consulter le secret", () => {
    expect(verifyTotpCode(RFC_SECRET_BASE32, "12345", 59_000)).toBe(false);
    expect(verifyTotpCode(RFC_SECRET_BASE32, "abcdef", 59_000)).toBe(false);
  });

  it("génère un secret aléatoire ré-encodable (aller-retour base32)", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    // Le secret généré doit lui-même produire des codes vérifiables (round-trip
    // interne encode/decode cohérent).
    const code = generateTotpCode(secret, Date.now());
    expect(verifyTotpCode(secret, code, Date.now())).toBe(true);
  });

  it("génère une URI otpauth:// avec les paramètres attendus", () => {
    const uri = totpUri(RFC_SECRET_BASE32, "admin@detailix.fr");
    expect(uri.startsWith("otpauth://totp/")).toBe(true);
    expect(uri).toContain(`secret=${RFC_SECRET_BASE32}`);
    expect(uri).toContain("issuer=Detailix");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });
});
