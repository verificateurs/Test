"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { readPending2fa, clearPending2fa } from "@/lib/auth/twofactor";
import { verifyTotp } from "@/lib/auth/totp";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
});

type State = { error: string } | null;

export async function verify2faAction(_prev: State, fd: FormData): Promise<State> {
  const userId = await readPending2fa();
  if (!userId) {
    redirect("/connexion");
  }

  const { allowed } = checkRateLimit(`2fa:${userId}`);
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const parsed = schema.safeParse({ code: fd.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Code invalide." };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.totpEnabled || !user.totpSecret) {
    await clearPending2fa();
    redirect("/connexion");
  }

  const valid = verifyTotp(user.totpSecret, parsed.data.code);
  if (!valid) {
    return { error: "Code invalide." };
  }

  await clearPending2fa();
  await createSession(user.id);
  redirect("/compte");
}
