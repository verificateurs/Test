import { describe, expect, it } from "vitest";
import { computeSellPrice, formatPrice, deliveryEstimate, starString } from "./catalogue";

describe("computeSellPrice", () => {
  it("applique la marge en pourcentage au coût d'achat", () => {
    expect(computeSellPrice(10, 50)).toBe(15);
  });

  it("une marge de 0% renvoie le coût d'achat inchangé", () => {
    expect(computeSellPrice(21.75, 0)).toBe(21.75);
  });

  it("arrondit au centime le plus proche", () => {
    expect(computeSellPrice(9.99, 33)).toBe(13.29); // 9.99 * 1.33 = 13.2867 -> 13.29
  });
});

describe("formatPrice", () => {
  it("formate en euros avec le séparateur français", () => {
    expect(formatPrice(12.5)).toBe("12,50 €");
  });

  it("gère les montants nuls", () => {
    expect(formatPrice(0)).toBe("0,00 €");
  });
});

describe("deliveryEstimate", () => {
  it("en stock -> livraison rapide", () => {
    expect(deliveryEstimate(true)).toEqual({ label: "Expédié sous 24h", className: "delivery-fast" });
  });

  it("hors stock -> livraison lente", () => {
    expect(deliveryEstimate(false)).toEqual({ label: "Sur commande, 5-7 jours", className: "delivery-slow" });
  });
});

describe("starString", () => {
  it("arrondit la note à l'étoile pleine la plus proche", () => {
    expect(starString(4.6)).toBe("★★★★★");
    expect(starString(4.4)).toBe("★★★★☆");
    expect(starString(0)).toBe("☆☆☆☆☆");
    expect(starString(5)).toBe("★★★★★");
  });
});
