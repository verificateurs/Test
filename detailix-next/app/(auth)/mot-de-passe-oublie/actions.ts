"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { createResetToken } from "@/lib/auth/reset";
import { sendMail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(255),
});

type State = { message: string } | null;

const GENERIC_MESSAGE = "Si ce compte existe, un e-mail de réinitialisation a été envoyé.";

export async function requestResetAction(_prev: State, fd: FormData): Promise<State> {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { allowed: ipAllowed } = checkRateLimit(`reset-request:${ip}`);
  if (!ipAllowed) {
    return { message: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  // Account-based lock in addition to the IP lock: x-forwarded-for is
  // client-controlled unless a trusted proxy rewrites it (see lib/rate-limit.ts).
  const rawEmail = fd.get("email");
  if (typeof rawEmail === "string" && rawEmail.trim() !== "") {
    const accountKey = rawEmail.trim().toLowerCase().slice(0, 255);
    const { allowed: accountAllowed } = checkRateLimit(`reset-request-account:${accountKey}`);
    if (!accountAllowed) {
      return { message: "Trop de tentatives. Réessayez dans 1 minute." };
    }
  }

  const parsed = schema.safeParse({ email: fd.get("email") });
  if (!parsed.success) {
    return { message: GENERIC_MESSAGE };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const rawToken = await createResetToken(user.id);
    const link = `/reinitialiser-mot-de-passe?token=${rawToken}`;
    await sendMail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe Detailix",
      text: `Pour réinitialiser votre mot de passe, ouvrez ce lien (valable 30 minutes) : ${link}`,
    });
  }

  return { message: GENERIC_MESSAGE };
}
