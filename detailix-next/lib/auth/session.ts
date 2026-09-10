import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/client";

const COOKIE = "detailix_session";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const raw = randomBytes(32).toString("hex");
  const id = sha256(raw);
  const expiresAt = new Date(Date.now() + TTL_MS);

  await db.session.create({ data: { id, userId, expiresAt } });

  const jar = await cookies();
  jar.set(COOKIE, raw, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession() {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const id = sha256(raw);
  const session = await db.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id } });
    return null;
  }
  return session;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    const id = sha256(raw);
    await db.session.deleteMany({ where: { id } }).catch(() => {});
  }
  jar.delete(COOKIE);
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

// ─── Guard helpers (call as first line of Server Actions / Route Handlers) ───

export async function requireUser() {
  const s = await getSession();
  if (!s) redirect("/connexion");
  return s.user;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s || s.user.role !== ("ADMIN" as Role)) redirect("/connexion");
  return s.user;
}

export async function requirePro() {
  const s = await getSession();
  if (!s || (s.user.role !== ("PRO" as Role) && s.user.role !== ("ADMIN" as Role)))
    redirect("/connexion");
  return s.user;
}
