"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createPending2fa } from "@/lib/auth/twofactor";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

type State = { error: string } | null;

export async function loginAction(_prev: State, fd: FormData): Promise<State> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { allowed: ipAllowed } = checkRateLimit(`login:${ip}`);
  if (!ipAllowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  // Account-based lock in addition to the IP lock: x-forwarded-for is
  // client-controlled unless a trusted proxy rewrites it (see lib/rate-limit.ts).
  const rawEmail = fd.get("email");
  if (typeof rawEmail === "string" && rawEmail.trim() !== "") {
    const accountKey = rawEmail.trim().toLowerCase().slice(0, 255);
    const { allowed: accountAllowed } = checkRateLimit(`login-account:${accountKey}`);
    if (!accountAllowed) {
      return { error: "Trop de tentatives. Réessayez dans 1 minute." };
    }
  }

  const parsed = schema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
  });
  if (!parsed.success) {
    return { error: "Identifiants incorrects." };
  }

  const { email, password } = parsed.data;

  // Constant-time: always run hashCheck even if user not found
  const user = await db.user.findUnique({ where: { email } });
  const fakeHash = "abcdef1234567890:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const storedHash = user?.passwordHash ?? fakeHash;
  const valid = await verifyPassword(password, storedHash);

  if (!valid || !user) {
    return { error: "Identifiants incorrects." };
  }

  if (user.totpEnabled) {
    await createPending2fa(user.id);
    redirect("/connexion/2fa");
  }

  await createSession(user.id);
  redirect("/compte");
}
