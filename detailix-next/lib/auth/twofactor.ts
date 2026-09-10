import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "detailix_pending_2fa";
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me-1a2b3c4d5e6f7890";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production (used to sign the pending-2FA cookie).");
  }
  return DEV_FALLBACK_SECRET;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

/** Marks a user as having passed password verification but pending TOTP confirmation. */
export async function createPending2fa(userId: string): Promise<void> {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${userId}.${expiresAt}`;
  const signature = sign(payload);
  const value = `${payload}.${signature}`;

  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_MS / 1000,
    path: "/",
  });
}

/** Returns the pending userId if the cookie is present, signed correctly, and not expired. */
export async function readPending2fa(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return null;

  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = value.slice(0, lastDot);
  const signature = value.slice(lastDot + 1);

  const expectedSignature = sign(payload);
  const sigBuf = Buffer.from(signature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const firstDot = payload.indexOf(".");
  if (firstDot === -1) return null;
  const userId = payload.slice(0, firstDot);
  const expiresAt = Number(payload.slice(firstDot + 1));
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return userId;
}

export async function clearPending2fa(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
