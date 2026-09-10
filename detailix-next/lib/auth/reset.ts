import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";

const TTL_MS = 30 * 60 * 1000; // 30 minutes

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/** Creates a password reset token and returns the RAW value (never stored in DB). */
export async function createResetToken(userId: string): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });

  return raw;
}

/**
 * Validates and consumes a raw reset token. Returns the associated userId
 * on success, or null if the token is unknown, expired, or already used.
 */
export async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = sha256(rawToken);

  const { count } = await db.passwordResetToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count !== 1) return null;

  const token = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  return token?.userId ?? null;
}
