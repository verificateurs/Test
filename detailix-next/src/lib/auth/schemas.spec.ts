import { describe, expect, it } from "vitest";
import { SignupSchema, LoginSchema } from "./schemas";

describe("SignupSchema", () => {
  it("accepte des valeurs valides et normalise l'email en minuscules", () => {
    const parsed = SignupSchema.parse({ email: "Test@Example.COM", password: "motdepasse-solide", displayName: "Camille" });
    expect(parsed.email).toBe("test@example.com");
  });

  it("refuse un mot de passe de moins de 10 caractères", () => {
    expect(SignupSchema.safeParse({ email: "a@b.com", password: "court", displayName: "X" }).success).toBe(false);
  });

  it("refuse un email invalide", () => {
    expect(SignupSchema.safeParse({ email: "pas-un-email", password: "motdepasse-solide", displayName: "X" }).success).toBe(false);
  });

  it("refuse un nom vide ou trop long", () => {
    expect(SignupSchema.safeParse({ email: "a@b.com", password: "motdepasse-solide", displayName: "" }).success).toBe(false);
    expect(
      SignupSchema.safeParse({ email: "a@b.com", password: "motdepasse-solide", displayName: "x".repeat(81) }).success
    ).toBe(false);
  });
});

describe("LoginSchema", () => {
  it("accepte n'importe quel mot de passe non vide (la vérification réelle se fait ailleurs)", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("refuse un mot de passe vide", () => {
    expect(LoginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});
