"use server";

import { z } from "zod";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { invalidateAllSessions } from "@/lib/auth/session";
import { consumeResetToken } from "@/lib/auth/reset";
import { checkRateLimit } from "@/lib/rate-limit";

// This form only carries a token, not an email, so the account-based lock
// below is keyed by userId instead of by normalized email (see lib/rate-limit.ts
// for why the IP-only lock isn't sufficient). The token is looked up without
// being consumed (no usedAt write) so a rate-limited attempt doesn't burn a
// legitimate single-use token. This duplicates the sha256 hashing done in
// lib/auth/reset.ts::consumeResetToken; a shared `peekResetToken` helper
// there would remove the duplication.
async function findUserIdForToken(rawToken: string): Promise<string | null> {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const token = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { userId: true, usedAt: true, expiresAt: true },
  });
  if (!token || token.usedAt || token.expiresAt <= new Date()) return null;
  return token.userId;
}

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(12, "Mot de passe trop court (12 caractères minimum)")
    .max(128)
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

type State = { error: string } | null;

export async function resetPasswordAction(_prev: State, fd: FormData): Promise<State> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { allowed: ipAllowed } = checkRateLimit(`reset-password:${ip}`);
  if (!ipAllowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const parsed = schema.safeParse({
    token: fd.get("token"),
    password: fd.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { token, password } = parsed.data;

  // Account-based lock in addition to the IP lock: x-forwarded-for is
  // client-controlled unless a trusted proxy rewrites it (see lib/rate-limit.ts).
  const accountUserId = await findUserIdForToken(token);
  if (accountUserId) {
    const { allowed: accountAllowed } = checkRateLimit(`reset-password-account:${accountUserId}`);
    if (!accountAllowed) {
      return { error: "Trop de tentatives. Réessayez dans 1 minute." };
    }
  }

  const userId = await consumeResetToken(token);
  if (!userId) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await invalidateAllSessions(userId);

  redirect("/connexion");
}
