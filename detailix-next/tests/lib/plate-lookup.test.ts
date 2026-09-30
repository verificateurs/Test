import { describe, it, expect } from "vitest";
import {
  isValidPlateFormat,
  normalizePlate,
  formatPlate,
  detectPlateFormat,
  plateToVehicleId,
} from "@/lib/plate-lookup";

describe("isValidPlateFormat / detectPlateFormat — SIV", () => {
  it("accepts the canonical dashed SIV format", () => {
    expect(isValidPlateFormat("AA-123-AA")).toBe(true);
    expect(detectPlateFormat("AA-123-AA")).toBe("siv");
  });

  it("accepts without separators, with spaces, and lowercase", () => {
    expect(isValidPlateFormat("AB123CD")).toBe(true);
    expect(isValidPlateFormat("ab 123 cd")).toBe(true);
    expect(isValidPlateFormat("AB-123-CD")).toBe(true);
  });

  it("rejects malformed plates", () => {
    expect(isValidPlateFormat("AA-1234-AA")).toBe(false);
    expect(isValidPlateFormat("123-AA-AA")).toBe(false);
    expect(isValidPlateFormat("")).toBe(false);
  });

  it("rejects I, O and U at every letter position of both groups", () => {
    for (const bad of ["IA-123-AB", "AI-123-AB", "AB-123-IA", "AB-123-AI"]) {
      expect(isValidPlateFormat(bad)).toBe(false);
    }
    for (const bad of ["OA-123-AB", "AO-123-AB", "AB-123-OA", "AB-123-AO"]) {
      expect(isValidPlateFormat(bad)).toBe(false);
    }
    for (const bad of ["UA-123-AB", "AU-123-AB", "AB-123-UA", "AB-123-AU"]) {
      expect(isValidPlateFormat(bad)).toBe(false);
    }
  });

  it("rejects SS and WW in the left letter group", () => {
    expect(isValidPlateFormat("SS-123-AB")).toBe(false);
    expect(isValidPlateFormat("WW-123-AB")).toBe(false);
  });

  it("rejects SS but accepts WW in the right letter group", () => {
    expect(isValidPlateFormat("AB-123-SS")).toBe(false);
    expect(isValidPlateFormat("AB-123-WW")).toBe(true);
  });
});

describe("isValidPlateFormat / detectPlateFormat — FNI", () => {
  it("accepts 1 to 4 digits, with and without separators, lowercase", () => {
    expect(isValidPlateFormat("1234 AB 56")).toBe(true);
    expect(isValidPlateFormat("1 AB 56")).toBe(true);
    expect(isValidPlateFormat("12AB56")).toBe(true);
    expect(isValidPlateFormat("1234-ab-56")).toBe(true);
    expect(detectPlateFormat("1234 AB 56")).toBe("fni");
  });

  it("rejects more than 4 digits or a malformed department code", () => {
    expect(isValidPlateFormat("12345 AB 56")).toBe(false);
    expect(isValidPlateFormat("1234 AB 5")).toBe(false);
    expect(isValidPlateFormat("1234 AB 567")).toBe(false);
  });

  it("rejects I and O, but still accepts U (removed from FNI only in Nov 1984)", () => {
    expect(isValidPlateFormat("1234 IB 56")).toBe(false);
    expect(isValidPlateFormat("1234 OB 56")).toBe(false);
    expect(isValidPlateFormat("1234 UB 56")).toBe(true);
  });

  it("accepts the last U plate ever issued in France (9999 TU 45, April 1991)", () => {
    expect(isValidPlateFormat("9999 TU 45")).toBe(true);
    expect(detectPlateFormat("9999 TU 45")).toBe("fni");
  });

  it("rejects the TT and WW series, but still accepts SS (only excluded late in the FNI era, department-dependent before that)", () => {
    expect(isValidPlateFormat("1234 TT 56")).toBe(false);
    expect(isValidPlateFormat("1234 WW 56")).toBe(false);
    expect(isValidPlateFormat("1234 SS 56")).toBe(true);
  });
});

describe("normalizePlate / formatPlate", () => {
  it("normalizes any valid SIV input to the same 7-char uppercase form", () => {
    expect(normalizePlate("ab-123-cd")).toBe("AB123CD");
    expect(normalizePlate("AB 123 CD")).toBe("AB123CD");
    expect(normalizePlate("AB123CD")).toBe("AB123CD");
  });

  it("formats the canonical SIV form back with dashes", () => {
    expect(formatPlate("ab123cd")).toBe("AB-123-CD");
  });

  it("formats a normalized FNI form back with dashes", () => {
    expect(formatPlate("1234ab56")).toBe("1234-AB-56");
    expect(formatPlate("1 ab 56")).toBe("1-AB-56");
  });

  it("never confuses a SIV key with an FNI key (different first character class)", () => {
    const sivKey = normalizePlate("AB-123-CD");
    const fniKey = normalizePlate("1234 AB 56");
    expect(sivKey).not.toBe(fniKey);
    expect(/^[A-Z]/.test(sivKey)).toBe(true);
    expect(/^\d/.test(fniKey)).toBe(true);
  });
});

describe("plateToVehicleId", () => {
  const ids500 = Array.from({ length: 500 }, (_, i) => `veh-${i}`);

  it("is deterministic: the same plate always resolves to the same id", () => {
    const a = plateToVehicleId("AB-123-CD", ids500);
    const b = plateToVehicleId("ab 123 cd", ids500);
    const c = plateToVehicleId("AB123CD", ids500);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).not.toBeNull();
  });

  it("is deterministic for the FNI format too", () => {
    const a = plateToVehicleId("1234 AB 56", ids500);
    const b = plateToVehicleId("1234AB56", ids500);
    const c = plateToVehicleId("1234-ab-56", ids500);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).not.toBeNull();
  });

  it("resolves for plates outside any fixed demo table (the original bug)", () => {
    for (const plate of ["ZZ-999-ZZ", "AB-001-CD", "MC-777-SH"]) {
      const id = plateToVehicleId(plate, ids500);
      expect(id).not.toBeNull();
      expect(ids500).toContain(id);
    }
  });

  it("returns null for an invalid format", () => {
    expect(plateToVehicleId("not-a-plate", ids500)).toBeNull();
  });

  it("returns null for an empty catalog", () => {
    expect(plateToVehicleId("AB-123-CD", [])).toBeNull();
  });

  it("is order-independent (rendezvous score, not positional index)", () => {
    const shuffled = [...ids500].reverse();
    const plates = ["AB-123-CD", "ZZ-999-ZZ", "GH-456-JK"];
    for (const plate of plates) {
      expect(plateToVehicleId(plate, ids500)).toBe(plateToVehicleId(plate, shuffled));
    }
  });

  // Small catalog so added/removed vehicles actually have visible odds of
  // winning at least one of the sample plates (with 500 ids, that chance is
  // too low for the assertions below to reliably exercise the "changed" path).
  const ids10 = Array.from({ length: 10 }, (_, i) => `veh-${i}`);
  const samplePlates = Array.from({ length: 300 }, (_, i) => {
    const n = String(i % 1000).padStart(3, "0");
    const l1 = String.fromCharCode(65 + (i % 21));
    const l2 = String.fromCharCode(65 + ((i * 7) % 21));
    return `A${l1}-${n}-B${l2}`;
  }).filter(isValidPlateFormat);

  it("stays stable when a vehicle is added: only plates that would now prefer the new id change", () => {
    const before = ids10;
    const after = [...ids10, "veh-new"];

    let changed = 0;
    for (const plate of samplePlates) {
      const prevId = plateToVehicleId(plate, before);
      const nextId = plateToVehicleId(plate, after);
      if (prevId !== nextId) {
        changed += 1;
        expect(nextId).toBe("veh-new");
      }
    }
    // Some plates should now prefer the new vehicle, but not all of them.
    expect(changed).toBeGreaterThan(0);
    expect(changed).toBeLessThan(samplePlates.length);
  });

  it("stays stable when a vehicle is removed: no other plate steals the removed one's association", () => {
    const withAll = ids10;
    // Pick an id that a known sample plate actually resolves to, so the
    // "was reassigned" branch below is guaranteed to run at least once.
    const removedId = plateToVehicleId(samplePlates[0], withAll)!;
    const without = ids10.filter((id) => id !== removedId);

    let reassigned = 0;
    for (const plate of samplePlates) {
      const before = plateToVehicleId(plate, withAll);
      const after = plateToVehicleId(plate, without);
      if (before !== removedId) {
        expect(after).toBe(before);
      } else {
        reassigned += 1;
        expect(after).not.toBeNull();
        expect(after).not.toBe(removedId);
      }
    }
    expect(reassigned).toBeGreaterThan(0);
  });
});
