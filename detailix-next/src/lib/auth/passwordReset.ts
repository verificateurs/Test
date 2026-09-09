import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth/tokenHash";

// Même schéma que Session (session.ts) : id = empreinte SHA-256 du jeton,
// jamais le jeton en clair en base. TTL court car le jeton transite par
// email (ou, en mode démo, par les logs serveur) plutôt que rester dans un
// cookie httpOnly.
const RESET_TTL_MS = 45 * 60 * 1000; // 45 minutes, usage unique

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  return token;
}

/**
 * Valide et consomme un jeton en une seule opération. Le marquage "utilisé"
 * passe par un updateMany conditionné sur usedAt: null (comme le décrément de
 * stock prévu en Phase 4) : deux requêtes concurrentes sur le même jeton ne
 * peuvent pas toutes les deux réussir, la seconde reçoit count === 0.
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const id = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { id } });
  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) return null;

  const result = await prisma.passwordResetToken.updateMany({
    where: { id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (result.count === 0) return null;

  return record.userId;
}
