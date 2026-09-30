import { describe, it, expect } from "vitest";
import { isValidPlateFormat, normalizePlate, formatPlate, plateToVehicleIndex } from "@/lib/plate-lookup";

describe("isValidPlateFormat", () => {
  it("accepts the canonical dashed SIV format", () => {
    expect(isValidPlateFormat("AA-123-AA")).toBe(true);
  });

  it("accepts without separators, with spaces, and lowercase", () => {
    expect(isValidPlateFormat("AA123AA")).toBe(true);
    expect(isValidPlateFormat("aa 123 aa")).toBe(true);
    expect(isValidPlateFormat("ab-123-cd")).toBe(true);
  });

  it("rejects malformed plates", () => {
    expect(isValidPlateFormat("AA-1234-AA")).toBe(false);
    expect(isValidPlateFormat("123-AA-AA")).toBe(false);
    expect(isValidPlateFormat("")).toBe(false);
  });
});

describe("normalizePlate / formatPlate", () => {
  it("normalizes any valid input to the same 7-char uppercase form", () => {
    expect(normalizePlate("aa-123-aa")).toBe("AA123AA");
    expect(normalizePlate("AA 123 AA")).toBe("AA123AA");
    expect(normalizePlate("AA123AA")).toBe("AA123AA");
  });

  it("formats the canonical form back with dashes", () => {
    expect(formatPlate("aa123aa")).toBe("AA-123-AA");
  });
});

describe("plateToVehicleIndex", () => {
  it("is deterministic: the same plate always resolves to the same index", () => {
    const a = plateToVehicleIndex("AB-123-CD", 500);
    const b = plateToVehicleIndex("ab 123 cd", 500);
    const c = plateToVehicleIndex("AB123CD", 500);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("resolves for plates outside any fixed demo table (the original bug)", () => {
    // Any well-formatted plate must resolve — not just a small hardcoded set.
    for (const plate of ["ZZ-999-ZZ", "QQ-001-QQ", "MC-777-SH"]) {
      const index = plateToVehicleIndex(plate, 500);
      expect(index).not.toBeNull();
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(500);
    }
  });

  it("returns null for an invalid format", () => {
    expect(plateToVehicleIndex("not-a-plate", 500)).toBeNull();
  });

  it("returns null for an empty catalog", () => {
    expect(plateToVehicleIndex("AA-123-AA", 0)).toBeNull();
  });
});
