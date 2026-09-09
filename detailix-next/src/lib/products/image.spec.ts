import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveProductImage } from "./image";

const PRODUCTS_DIR = join(process.cwd(), "public", "products");

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

/**
 * Garde-fou d'intégrité (pas de vérification de licence — voir le plan de
 * la Phase 6.3 : source informative, pas juridique) : chaque `.webp` réel
 * doit avoir une entrée dans le manifeste de provenance, et le manifeste ne
 * doit pas pointer vers un fichier absent — évite un fichier orphelin ou un
 * manifeste qui mentionne un fichier supprimé sans que personne ne le
 * remarque.
 */
describe("sources.json — intégrité du manifeste de provenance", () => {
  const webpFiles = readdirSync(PRODUCTS_DIR)
    .filter((name) => name.endsWith(".webp"))
    .map((name) => name.replace(/\.webp$/, ""));
  const manifest: Record<string, { sourceUrl: string; retrievedDate: string }> = JSON.parse(
    readFileSync(join(PRODUCTS_DIR, "sources.json"), "utf8"),
  );

  it("a au moins une photo réelle (sinon ce test ne teste rien)", () => {
    expect(webpFiles.length).toBeGreaterThan(0);
  });

  it.each(webpFiles)("%s.webp a une entrée complète dans sources.json", (productId) => {
    const entry = manifest[productId];
    expect(entry).toBeDefined();
    expect(entry.sourceUrl).toMatch(/^https?:\/\//);
    expect(entry.retrievedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ne contient aucune entrée pointant vers un fichier .webp absent", () => {
    const orphans = Object.keys(manifest).filter((productId) => !webpFiles.includes(productId));
    expect(orphans).toEqual([]);
  });
});
