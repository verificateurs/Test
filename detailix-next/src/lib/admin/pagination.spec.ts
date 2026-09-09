import { describe, expect, it } from "vitest";
import { clampPage, parsePage, parseSearchQuery } from "./pagination";

describe("parsePage", () => {
  it("accepte un entier positif", () => {
    expect(parsePage("3")).toBe(3);
  });

  it("replie sur 1 si absent, non numérique, négatif, nul ou non entier", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage("-1")).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("2.5")).toBe(1);
  });
});

describe("parseSearchQuery", () => {
  it("retire les espaces superflus", () => {
    expect(parseSearchQuery("  led h4  ")).toBe("led h4");
  });

  it("retourne une chaîne vide si absent", () => {
    expect(parseSearchQuery(undefined)).toBe("");
  });

  it("borne la longueur pour éviter un paramètre abusif", () => {
    expect(parseSearchQuery("a".repeat(500)).length).toBe(200);
  });
});

describe("clampPage", () => {
  it("laisse une page valide inchangée", () => {
    expect(clampPage(2, 45, 20)).toBe(2);
  });

  it("ramène une page hors bornes à la dernière page réelle", () => {
    expect(clampPage(999, 45, 20)).toBe(3);
  });

  it("retombe sur la page 1 quand il n'y a aucun résultat", () => {
    expect(clampPage(5, 0, 20)).toBe(1);
  });
});
