"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { verifyTotp } from "@/lib/auth/totp";
import { checkRateLimit } from "@/lib/rate-limit";

const enableSchema = z.object({
  secret: z.string().regex(/^[A-Z2-7]{16,64}$/, "Secret invalide."),
  code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
});

const disableSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Le code doit contenir 6 chiffres."),
});

type State = { error: string } | null;

export async function enable2faAction(_prev: State, fd: FormData): Promise<State> {
  const user = await requireAdmin();

  const { allowed } = checkRateLimit(`2fa-enable:${user.id}`);
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const parsed = enableSchema.safeParse({
    secret: fd.get("secret"),
    code: fd.get("code"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { secret, code } = parsed.data;
  if (!verifyTotp(secret, code)) {
    return { error: "Code invalide. Vérifiez l'heure de votre appareil et réessayez." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: true },
  });

  redirect("/compte/securite");
}

export async function disable2faAction(_prev: State, fd: FormData): Promise<State> {
  const user = await requireAdmin();

  const { allowed } = checkRateLimit(`2fa-disable:${user.id}`);
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const current = await db.user.findUnique({ where: { id: user.id } });
  if (!current?.totpEnabled || !current.totpSecret) {
    redirect("/compte/securite");
  }

  const parsed = disableSchema.safeParse({ code: fd.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  if (!verifyTotp(current.totpSecret, parsed.data.code)) {
    return { error: "Code invalide." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  redirect("/compte/securite");
}
