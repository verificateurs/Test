"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, safeRedirectPath } from "@/lib/auth/session";
import { checkRateLimit, sweepRateLimitBuckets } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/rbac";
import { SignupSchema, LoginSchema } from "@/lib/auth/schemas";

export type AuthActionState = {
  error: string | null;
  // Champs non sensibles resoumis pour réafficher le formulaire après une
  // erreur : React réinitialise les champs non contrôlés d'un <form action=…>
  // dès que l'action se termine (même en cas d'erreur métier, tant qu'elle ne
  // lève pas) — sans ça l'utilisateur devrait retaper son email à chaque
  // tentative. Le mot de passe n'est jamais renvoyé.
  values?: { email?: string; displayName?: string };
};

export async function signupAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  sweepRateLimitBuckets();
  const emailRaw = String(formData.get("email") ?? "");
  const displayNameRaw = String(formData.get("displayName") ?? "");
  const values = { email: emailRaw, displayName: displayNameRaw };

  const ip = await getClientIp();
  const limit = checkRateLimit(`signup:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values };

  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide", values };

  const { email, password, displayName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Un compte existe déjà avec cet email.", values };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, displayName, role: "CUSTOMER" },
  });

  await createSession(user.id);
  redirect(safeRedirectPath(formData.get("next") as string | null, "/compte"));
}

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  sweepRateLimitBuckets();
  const ip = await getClientIp();
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const values = { email: emailRaw };

  // Deux clés : par IP (empêche le bourrage massif) et par IP+email (empêche le
  // ciblage d'un compte précis) — l'une ou l'autre suffit à bloquer.
  const ipLimit = checkRateLimit(`login:ip:${ip}`, { max: 20, windowMs: 15 * 60 * 1000 });
  const ieLimit = checkRateLimit(`login:ie:${ip}:${emailRaw}`, { max: 5, windowMs: 15 * 60 * 1000 });
  if (!ipLimit.allowed || !ieLimit.allowed) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values };
  }

  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Email ou mot de passe incorrect.", values };

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Message identique que l'utilisateur existe ou non : ne pas révéler quels
  // emails sont enregistrés (énumération de comptes).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email ou mot de passe incorrect.", values };
  }

  // Rotation : toute session précédente sur ce navigateur est invalidée avant
  // d'en créer une nouvelle (protection contre la fixation de session).
  await destroySession();
  await createSession(user.id);
  redirect(safeRedirectPath(formData.get("next") as string | null, "/compte"));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
