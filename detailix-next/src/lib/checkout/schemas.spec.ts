import { describe, expect, it } from "vitest";
import { CartItemsInputSchema, CheckoutSchema } from "./schemas";

describe("CartItemsInputSchema", () => {
  it("accepte une liste de lignes valides", () => {
    expect(CartItemsInputSchema.safeParse([{ productId: "p1", qty: 2 }]).success).toBe(true);
  });

  it("refuse un panier vide", () => {
    expect(CartItemsInputSchema.safeParse([]).success).toBe(false);
  });

  it("refuse une quantité nulle, négative ou non entière", () => {
    expect(CartItemsInputSchema.safeParse([{ productId: "p1", qty: 0 }]).success).toBe(false);
    expect(CartItemsInputSchema.safeParse([{ productId: "p1", qty: -1 }]).success).toBe(false);
    expect(CartItemsInputSchema.safeParse([{ productId: "p1", qty: 1.5 }]).success).toBe(false);
  });

  it("refuse une quantité supérieure à 99 (plafond anti-abus)", () => {
    expect(CartItemsInputSchema.safeParse([{ productId: "p1", qty: 100 }]).success).toBe(false);
  });
});

describe("CheckoutSchema", () => {
  const validInput = {
    email: "test@example.com",
    shippingName: "Camille Test",
    shippingAddr: "1 rue de Test",
    shippingZip: "75001",
    shippingCity: "Paris",
  };

  it("accepte des coordonnées de livraison valides sans code promo", () => {
    const parsed = CheckoutSchema.parse(validInput);
    expect(parsed.promoCode).toBeUndefined();
  });

  it("normalise le code promo en majuscules", () => {
    const parsed = CheckoutSchema.parse({ ...validInput, promoCode: "bienvenue10" });
    expect(parsed.promoCode).toBe("BIENVENUE10");
  });

  it("refuse un code postal qui n'est pas 5 chiffres", () => {
    expect(CheckoutSchema.safeParse({ ...validInput, shippingZip: "ABCDE" }).success).toBe(false);
    expect(CheckoutSchema.safeParse({ ...validInput, shippingZip: "123" }).success).toBe(false);
  });

  it("refuse une adresse ou un nom vide", () => {
    expect(CheckoutSchema.safeParse({ ...validInput, shippingAddr: "" }).success).toBe(false);
    expect(CheckoutSchema.safeParse({ ...validInput, shippingName: "" }).success).toBe(false);
  });
});
