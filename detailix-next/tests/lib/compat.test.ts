import { describe, it, expect } from "vitest";
import { parseCompatCodes, parseCompat, isCompatible } from "@/lib/compat";

describe("parseCompatCodes", () => {
  it("returns 'universel' for a universal JSON string", () => {
    expect(parseCompatCodes(JSON.stringify({ type: "universel" }))).toBe("universel");
  });

  it("returns 'universel' when already given a parsed object", () => {
    expect(parseCompatCodes({ type: "universel" } as unknown as string)).toBe("universel");
  });

  it("returns the code array for a valid codesMoteurs JSON string", () => {
    const raw = JSON.stringify({ type: "codesMoteurs", codes: ["ABC123", "XYZ789"] });
    expect(parseCompatCodes(raw)).toEqual(["ABC123", "XYZ789"]);
  });

  it("returns undefined when codesMoteurs.codes is not an array", () => {
    const raw = JSON.stringify({ type: "codesMoteurs", codes: "not-an-array" });
    expect(parseCompatCodes(raw)).toBeUndefined();
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseCompatCodes("{not valid json")).toBeUndefined();
  });

  it("returns undefined for an unrecognized type", () => {
    expect(parseCompatCodes(JSON.stringify({ type: "somethingElse" }))).toBeUndefined();
  });

  it("returns undefined for null", () => {
    expect(parseCompatCodes(null as unknown as string)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(parseCompatCodes("")).toBeUndefined();
  });
});

describe("parseCompat", () => {
  it("parses a plateformes entry distinctly from codesMoteurs", () => {
    const raw = JSON.stringify({ type: "plateformes", codes: ["EK", "DC2"] });
    expect(parseCompat(raw)).toEqual({ mode: "plateformes", codes: ["EK", "DC2"] });
  });

  it("parses universel with an empty codes array", () => {
    expect(parseCompat(JSON.stringify({ type: "universel" }))).toEqual({ mode: "universel", codes: [] });
  });
});

describe("isCompatible", () => {
  it("is always true for universel", () => {
    expect(isCompatible({ mode: "universel", codes: [] }, { codeMoteur: "ANYTHING" })).toBe(true);
  });

  it("matches codesMoteurs by codeMoteur only, ignoring platform", () => {
    const compat = { mode: "codesMoteurs" as const, codes: ["B16A"] };
    expect(isCompatible(compat, { codeMoteur: "B16A", platform: "EK" })).toBe(true);
    expect(isCompatible(compat, { codeMoteur: "B16A", platform: "DC2" })).toBe(true);
    expect(isCompatible(compat, { codeMoteur: "D16Y8", platform: "EK" })).toBe(false);
  });

  it("matches plateformes by platform only, ignoring codeMoteur", () => {
    const compat = { mode: "plateformes" as const, codes: ["EK"] };
    expect(isCompatible(compat, { codeMoteur: "B16A", platform: "EK" })).toBe(true);
    expect(isCompatible(compat, { codeMoteur: "B16A", platform: "DC2" })).toBe(false);
    expect(isCompatible(compat, { codeMoteur: "B16A" })).toBe(false);
  });

  it("is false when compat is undefined", () => {
    expect(isCompatible(undefined, { codeMoteur: "B16A" })).toBe(false);
  });
});
