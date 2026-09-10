import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("hashPassword / verifyPassword", () => {
  it("produces a different hash each time for the same password (random salt)", async () => {
    const hash1 = await hashPassword("Sup3rSecret!");
    const hash2 = await hashPassword("Sup3rSecret!");
    expect(hash1).not.toBe(hash2);
  });

  it("stores the hash as salt:hash", async () => {
    const hash = await hashPassword("Sup3rSecret!");
    const parts = hash.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("verifies the correct password as true", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("correct-horse-battery-staple", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects an empty password against a real hash", async () => {
    const hash = await hashPassword("correct-horse-battery-staple");
    await expect(verifyPassword("", hash)).resolves.toBe(false);
  });

  it("does not throw and returns false for a hash missing the separator", async () => {
    await expect(verifyPassword("anything", "not-a-valid-hash")).resolves.toBe(false);
  });

  it("does not throw and returns false for a completely empty stored value", async () => {
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
  });

  it("does not throw and returns false for a stored value with an empty hash part", async () => {
    await expect(verifyPassword("anything", "somesalt:")).resolves.toBe(false);
  });

  it("does not throw and returns false for non-hex garbage after the salt", async () => {
    await expect(verifyPassword("anything", "somesalt:zzz-not-hex-zzz")).resolves.toBe(false);
  });

  it("does not throw and returns false for a hash with extra separators", async () => {
    await expect(verifyPassword("anything", "salt:aa:bb:cc")).resolves.toBe(false);
  });
});
