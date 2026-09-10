import { describe, it, expect } from "vitest";
import { parseCompatCodes } from "@/lib/compat";

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
