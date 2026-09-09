import { describe, expect, it } from "vitest";
import { parseCompatibilite, compatibilityStatus, COMPAT_LABELS } from "./compat";

describe("parseCompatibilite", () => {
  it("reconnaît la valeur littérale universel", () => {
    expect(parseCompatibilite("universel")).toBe("universel");
  });

  it("parse un JSON valide de type codesMoteurs", () => {
    expect(parseCompatibilite('{"type":"codesMoteurs","codes":["DTSA","DPCA"]}')).toEqual({
      type: "codesMoteurs",
      codes: ["DTSA", "DPCA"],
    });
  });

  it("retombe sur une liste de codes vide pour un JSON malformé", () => {
    expect(parseCompatibilite("{not valid json")).toEqual({ type: "codesMoteurs", codes: [] });
  });

  it("retombe sur une liste de codes vide pour un JSON valide mais de forme inattendue", () => {
    expect(parseCompatibilite('{"type":"autre-chose"}')).toEqual({ type: "codesMoteurs", codes: [] });
    expect(parseCompatibilite('{"type":"codesMoteurs","codes":"pas-un-tableau"}')).toEqual({
      type: "codesMoteurs",
      codes: [],
    });
  });
});

describe("compatibilityStatus", () => {
  it("un produit universel est toujours universel, avec ou sans véhicule actif", () => {
    expect(compatibilityStatus("universel", null)).toBe("universel");
    expect(compatibilityStatus("universel", "DTSA")).toBe("universel");
  });

  it("aucun véhicule actif -> à vérifier, même avec des codes déclarés", () => {
    expect(compatibilityStatus({ type: "codesMoteurs", codes: ["DTSA"] }, null)).toBe("a-verifier");
  });

  it("aucun code déclaré -> à vérifier, même avec un véhicule actif", () => {
    expect(compatibilityStatus({ type: "codesMoteurs", codes: [] }, "DTSA")).toBe("a-verifier");
  });

  it("le code moteur du véhicule actif correspond -> compatible", () => {
    expect(compatibilityStatus({ type: "codesMoteurs", codes: ["DTSA", "DPCA"] }, "DTSA")).toBe("compatible");
  });

  it("le code moteur du véhicule actif ne correspond pas -> incompatible", () => {
    expect(compatibilityStatus({ type: "codesMoteurs", codes: ["DTSA"] }, "AUTRE")).toBe("incompatible");
  });
});

describe("COMPAT_LABELS", () => {
  it("couvre les quatre statuts possibles", () => {
    expect(Object.keys(COMPAT_LABELS).sort()).toEqual(["a-verifier", "compatible", "incompatible", "universel"].sort());
  });
});
