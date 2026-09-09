import { describe, expect, it } from "vitest";
import { resolveProductImage } from "./image";

describe("resolveProductImage", () => {
  it("retourne le chemin public quand le fichier webp existe", () => {
    const files = new Set(["philips-led-h4.webp", "303-aerospace-protectant.webp"]);
    expect(resolveProductImage("philips-led-h4", files)).toBe("/products/philips-led-h4.webp");
  });

  it("retourne null quand aucun fichier ne correspond à l'id produit", () => {
    const files = new Set(["philips-led-h4.webp"]);
    expect(resolveProductImage("meguiars-shampoing-gold-class", files)).toBeNull();
  });

  it("retourne null pour un ensemble de fichiers vide", () => {
    expect(resolveProductImage("philips-led-h4", new Set())).toBeNull();
  });

  it("ne fait pas de correspondance partielle sur un id préfixe d'un autre", () => {
    const files = new Set(["philips-led-h4-kit.webp"]);
    expect(resolveProductImage("philips-led-h4", files)).toBeNull();
  });
});
