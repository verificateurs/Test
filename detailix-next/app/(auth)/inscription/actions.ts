"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(12, "Mot de passe trop court (12 caractères minimum)")
    .max(128)
    .regex(/[A-Z]/, "Doit contenir une majuscule")
    .regex(/[0-9]/, "Doit contenir un chiffre"),
});

type State = { error: string } | null;

export async function registerAction(_prev: State, fd: FormData): Promise<State> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`register:${ip}`);
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const parsed = schema.safeParse({
    email: fd.get("email"),
    password: fd.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { email, password } = parsed.data;

  // Always hash before checking existence (anti-timing leak)
  const passwordHash = await hashPassword(password);

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/compte");
  }

  const user = await db.user.create({ data: { email, passwordHash } });
  await createSession(user.id);
  redirect("/compte");
}
