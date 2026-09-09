import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokenHash";
import { PENDING_2FA_COOKIE } from "@/lib/auth/constants";
import type { User } from "@/generated/prisma/client";

// Juste le temps de saisir un code TOTP (fenêtre de validité du code
// lui-même : 30-90s avec la tolérance de dérive de totp.ts) — volontairement
// bien plus court que SESSION_TTL_MS.
const PENDING_TTL_MS = 10 * 60 * 1000;

export async function createPendingTwoFactor(userId: string, next: string | null): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PENDING_TTL_MS);

  await prisma.pendingTwoFactor.create({
    data: { id: hashToken(token), userId, next, expiresAt },
  });

  const jar = await cookies();
  jar.set(PENDING_2FA_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_TTL_MS / 1000,
  });
}

export async function getPendingTwoFactor(): Promise<{ user: User; next: string | null } | null> {
  const jar = await cookies();
  const token = jar.get(PENDING_2FA_COOKIE)?.value;
  if (!token) return null;

  const record = await prisma.pendingTwoFactor.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!record) return null;

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.pendingTwoFactor.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  return { user: record.user, next: record.next };
}

export async function clearPendingTwoFactor(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(PENDING_2FA_COOKIE)?.value;
  if (token) {
    await prisma.pendingTwoFactor.delete({ where: { id: hashToken(token) } }).catch(() => {});
  }
  jar.delete(PENDING_2FA_COOKIE);
}
