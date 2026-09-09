import { describe, expect, it } from "vitest";
import { computeShippingCost, STANDARD_SHIPPING_COST } from "./pricing";

describe("computeShippingCost", () => {
  it("facture le forfait standard sous le seuil de livraison offerte", () => {
    expect(computeShippingCost(50, 79, false)).toBe(STANDARD_SHIPPING_COST);
  });

  it("offre la livraison au seuil exact (inclusif)", () => {
    expect(computeShippingCost(79, 79, false)).toBe(0);
  });

  it("offre la livraison au-delà du seuil", () => {
    expect(computeShippingCost(150, 79, false)).toBe(0);
  });

  it("un code promo freeShipping l'emporte même sous le seuil", () => {
    expect(computeShippingCost(10, 79, true)).toBe(0);
  });
});
