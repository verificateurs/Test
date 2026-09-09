import { describe, expect, it } from "vitest";
import { ProductFormSchema, buildCompatibilite } from "./schemas";

const validInput = {
  name: "Produit Test",
  format: "1 unité",
  description: "Description de test.",
  prixAchat: "10",
  stockQty: "25",
  compatibiliteType: "universel" as const,
  brandId: "brand-1",
  categoryId: "cat-1",
};

describe("ProductFormSchema", () => {
  it("accepte des valeurs valides et coerce les types HTML (string -> number)", () => {
    const parsed = ProductFormSchema.parse(validInput);
    expect(parsed.prixAchat).toBe(10);
    expect(parsed.stockQty).toBe(25);
  });

  it("refuse un prix d'achat négatif ou nul", () => {
    expect(ProductFormSchema.safeParse({ ...validInput, prixAchat: "0" }).success).toBe(false);
    expect(ProductFormSchema.safeParse({ ...validInput, prixAchat: "-5" }).success).toBe(false);
  });

  it("refuse une quantité en stock négative ou non entière", () => {
    expect(ProductFormSchema.safeParse({ ...validInput, stockQty: "-1" }).success).toBe(false);
    expect(ProductFormSchema.safeParse({ ...validInput, stockQty: "2.5" }).success).toBe(false);
  });

  it("accepte une quantité en stock nulle (rupture de stock)", () => {
    expect(ProductFormSchema.safeParse({ ...validInput, stockQty: "0" }).success).toBe(true);
  });

  it("refuse un type de compatibilité inconnu (pas de mass-assignment via une valeur arbitraire)", () => {
    expect(ProductFormSchema.safeParse({ ...validInput, compatibiliteType: "autre-chose" }).success).toBe(false);
  });

  it("ne conserve que les champs déclarés du schéma (pas de mass-assignment)", () => {
    const parsed = ProductFormSchema.parse({ ...validInput, marginPercent: "9999", role: "ADMIN" });
    expect(parsed).not.toHaveProperty("marginPercent");
    expect(parsed).not.toHaveProperty("role");
  });
});

describe("buildCompatibilite", () => {
  it("universel produit la chaîne littérale, sans tenir compte des codes fournis", () => {
    expect(buildCompatibilite({ compatibiliteType: "universel", compatibiliteCodes: "DTSA,DPCA" })).toBe("universel");
  });

  it("codesMoteurs sérialise en JSON, en retirant les espaces et entrées vides", () => {
    expect(buildCompatibilite({ compatibiliteType: "codesMoteurs", compatibiliteCodes: " DTSA , , DPCA " })).toBe(
      JSON.stringify({ type: "codesMoteurs", codes: ["DTSA", "DPCA"] })
    );
  });

  it("codesMoteurs sans code fourni produit une liste vide", () => {
    expect(buildCompatibilite({ compatibiliteType: "codesMoteurs", compatibiliteCodes: "" })).toBe(
      JSON.stringify({ type: "codesMoteurs", codes: [] })
    );
  });
});
