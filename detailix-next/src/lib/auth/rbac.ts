import "server-only";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import type { User } from "@/generated/prisma/client";

export async function requireUser(nextPath?: string): Promise<User> {
  const session = await getSession();
  if (!session) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/connexion${suffix}`);
  }
  return session.user;
}

/**
 * Défense en profondeur : chaque Server Action admin doit appeler cette
 * fonction en première ligne. Le layout admin fait déjà ce contrôle, mais une
 * Server Action reste en principe invocable directement (son id est exposé au
 * client) — s'y fier seul serait insuffisant.
 */
export async function requireAdmin(): Promise<User> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=%2Fadmin");
  if (session.user.role !== "ADMIN") redirect("/");
  return session.user;
}

/** IP approximative du client, pour la clé du limiteur de débit. Best-effort. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}
