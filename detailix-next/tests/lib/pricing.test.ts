import { describe, it, expect, afterEach, vi } from "vitest";
import path from "node:path";
import os from "node:os";
import { computePrice } from "@/lib/pricing";

// computePrice caches the resolved margin in a module-level `_margin` variable
// after the first call. The statically-imported `computePrice` above always
// resolves against the real `data/pricing-config.json` (marginPercent: 45),
// because it is evaluated once, before any test runs, with the real
// process.cwd(). The fallback scenario below intentionally uses a fresh,
// dynamically re-imported module instance so it does not pollute (or get
// polluted by) that cached margin.

describe("computePrice (real config, marginPercent: 45)", () => {
  it("applies the configured margin to a round number", () => {
    expect(computePrice(100)).toBe(145);
  });

  it("rounds the result to 2 decimal places", () => {
    // 33.333 * 1.45 = 48.33285 -> rounds to 48.33
    expect(computePrice(33.333)).toBe(48.33);
  });

  it("returns 0 for a purchase price of 0", () => {
    expect(computePrice(0)).toBe(0);
  });

  it("is deterministic across repeated calls", () => {
    expect(computePrice(50)).toBe(computePrice(50));
  });
});

describe("computePrice (fallback margin when config is unreadable)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to a 30% margin when the pricing config file cannot be read", async () => {
    vi.resetModules();
    // Point process.cwd() somewhere with no ../data/pricing-config.json,
    // so the module's readFileSync call throws and getMargin() falls back to 30.
    vi.spyOn(process, "cwd").mockReturnValue(
      path.join(os.tmpdir(), `detailix-no-config-${Date.now()}`)
    );

    const isolated = await import("@/lib/pricing");
    // 100 * 1.30 = 130
    expect(isolated.computePrice(100)).toBe(130);
  });
});
