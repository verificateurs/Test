import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// The module keeps a shared in-memory Map across the whole test file, so every
// test uses its own unique key to avoid interference between tests.
let keyCounter = 0;
function freshKey(): string {
  keyCounter += 1;
  return `test-key-${keyCounter}`;
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first attempt and reports 4 remaining", () => {
    const key = freshKey();
    const result = checkRateLimit(key);
    expect(result).toEqual({ allowed: true, remaining: 4 });
  });

  it("allows exactly 5 attempts within the window, then blocks the 6th", () => {
    const key = freshKey();
    const results = Array.from({ length: 6 }, () => checkRateLimit(key));

    expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true);
    expect(results[4]).toEqual({ allowed: true, remaining: 0 });
    expect(results[5]).toEqual({ allowed: false, remaining: 0 });
  });

  it("keeps blocking further attempts once the limit is exceeded, within the same window", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) checkRateLimit(key);

    const sixth = checkRateLimit(key);
    const seventh = checkRateLimit(key);

    expect(sixth.allowed).toBe(false);
    expect(seventh.allowed).toBe(false);
  });

  it("resets the counter after the 60s sliding window elapses", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) checkRateLimit(key);
    expect(checkRateLimit(key).allowed).toBe(false);

    // Advance the system clock past the 60s window without running timers.
    vi.setSystemTime(new Date("2026-01-01T00:01:00.001Z"));

    const afterReset = checkRateLimit(key);
    expect(afterReset).toEqual({ allowed: true, remaining: 4 });
  });

  it("does not reset before the window has fully elapsed", () => {
    const key = freshKey();
    for (let i = 0; i < 5; i++) checkRateLimit(key);

    // Still inside the 60s window.
    vi.setSystemTime(new Date("2026-01-01T00:00:59.999Z"));

    const stillBlocked = checkRateLimit(key);
    expect(stillBlocked.allowed).toBe(false);
  });

  it("tracks independent keys separately", () => {
    const keyA = freshKey();
    const keyB = freshKey();

    for (let i = 0; i < 5; i++) checkRateLimit(keyA);
    expect(checkRateLimit(keyA).allowed).toBe(false);

    // keyB has never been used, so it should still be allowed.
    expect(checkRateLimit(keyB)).toEqual({ allowed: true, remaining: 4 });
  });
});
