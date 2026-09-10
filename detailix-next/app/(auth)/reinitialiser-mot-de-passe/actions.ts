"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { invalidateAllSessions } from "@/lib/auth/session";
import { consumeResetToken } from "@/lib/auth/reset";

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
  const parsed = schema.safeParse({
    token: fd.get("token"),
    password: fd.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { token, password } = parsed.data;

  const userId = await consumeResetToken(token);
  if (!userId) {
    return { error: "Ce lien de réinitialisation est invalide ou a expiré." };
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  await invalidateAllSessions(userId);

  redirect("/connexion");
}
