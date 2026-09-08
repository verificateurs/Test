import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { User } from "@/generated/prisma/client";

export { SESSION_COOKIE };
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours, expiration fixe

/**
 * Le cookie contient un token aléatoire opaque (256 bits d'entropie). Seul son
 * empreinte SHA-256 est stockée en base : lire la base ne permet donc jamais de
 * reconstituer un cookie valide. Pas de secret serveur (HMAC/pepper) nécessaire
 * ici — contrairement à un mot de passe, le token n'est jamais choisi par un
 * humain ni réutilisé ailleurs, sa seule entropie suffit.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function getSession(): Promise<{ user: User } | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    // Session expirée : nettoyage paresseux, pas de tâche cron nécessaire pour ce lot.
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return { user: session.user };
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.delete({ where: { id: hashToken(token) } }).catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Accepte uniquement un chemin interne ("/compte", "/panier"...) pour éviter
 * une redirection ouverte via ?next=. Toute valeur suspecte retombe sur le
 * chemin par défaut.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback;
  return raw;
}
