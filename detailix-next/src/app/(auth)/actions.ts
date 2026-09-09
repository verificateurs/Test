"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, safeRedirectPath } from "@/lib/auth/session";
import { checkRateLimit, sweepRateLimitBuckets } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/auth/rbac";
import { SignupSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, TotpCodeSchema } from "@/lib/auth/schemas";
import { createPasswordResetToken, consumePasswordResetToken } from "@/lib/auth/passwordReset";
import { createPendingTwoFactor, getPendingTwoFactor, clearPendingTwoFactor } from "@/lib/auth/twoFactor";
import { verifyTotpCode } from "@/lib/auth/totp";
import { sendPasswordResetEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

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
  const limit = await checkRateLimit(`signup:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
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
  const [ipLimit, ieLimit] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, { max: 20, windowMs: 15 * 60 * 1000 }),
    checkRateLimit(`login:ie:${ip}:${emailRaw}`, { max: 5, windowMs: 15 * 60 * 1000 }),
  ]);
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

  // Mot de passe vérifié, mais compte protégé par 2FA : pas de session tout
  // de suite, un état intermédiaire (cookie distinct, TTL court) porte
  // l'utilisateur jusqu'à /connexion/verification. Le ?next= d'origine
  // traverse ce détour via PendingTwoFactor.next.
  if (user.totpEnabled) {
    await createPendingTwoFactor(user.id, (formData.get("next") as string | null) ?? null);
    redirect("/connexion/verification");
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

export type TwoFactorState = { error: string | null };

export async function verifyTwoFactorAction(_prev: TwoFactorState, formData: FormData): Promise<TwoFactorState> {
  sweepRateLimitBuckets();
  const pending = await getPendingTwoFactor();
  if (!pending) redirect("/connexion");

  const ip = await getClientIp();
  const limit = await checkRateLimit(`2fa:ip:${ip}:${pending.user.id}`, { max: 8, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };

  const parsed = TotpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success || !pending.user.totpSecret || !verifyTotpCode(pending.user.totpSecret, parsed.data.code)) {
    return { error: "Code invalide." };
  }

  const next = pending.next;
  await clearPendingTwoFactor();
  await createSession(pending.user.id);
  redirect(safeRedirectPath(next, "/admin"));
}

export type ForgotPasswordState = { submitted: boolean; error: string | null };

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  sweepRateLimitBuckets();
  const parsed = ForgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { submitted: false, error: "Adresse email invalide." };

  const { email } = parsed.data;
  const ip = await getClientIp();
  // Deux clés, comme login : IP (bourrage massif) et IP+email (ciblage d'un
  // compte précis). Le message de rate-limit ne dépend pas de l'existence du
  // compte, donc n'introduit aucun oracle.
  const [ipLimit, ieLimit] = await Promise.all([
    checkRateLimit(`pwreset:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 }),
    checkRateLimit(`pwreset:ie:${ip}:${email}`, { max: 5, windowMs: 15 * 60 * 1000 }),
  ]);
  if (!ipLimit.allowed || !ieLimit.allowed) {
    return { submitted: false, error: "Trop de tentatives. Réessayez dans quelques minutes." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, absoluteUrl(`/reinitialiser-mot-de-passe/${token}`));
  }

  // Réponse strictement identique que le compte existe ou non : ne jamais
  // révéler si un email est enregistré (voir passwordReset.ts et
  // lib/email/index.ts::sendPasswordResetEmail — le lien n'est en mode démo
  // jamais renvoyé dans cette réponse, seulement loggé côté serveur).
  return { submitted: true, error: null };
}

export type ResetPasswordState = { error: string | null; success: boolean };

export async function resetPasswordAction(_prev: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  sweepRateLimitBuckets();
  const ip = await getClientIp();
  const limit = await checkRateLimit(`pwreset-consume:ip:${ip}`, { max: 20, windowMs: 15 * 60 * 1000 });
  if (!limit.allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", success: false };

  const token = String(formData.get("token") ?? "");
  const parsed = ResetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!token || !parsed.success) {
    return { error: parsed.success ? "Lien invalide." : (parsed.error.issues[0]?.message ?? "Mot de passe invalide."), success: false };
  }

  const userId = await consumePasswordResetToken(token);
  if (!userId) return { error: "Ce lien de réinitialisation est invalide ou a expiré.", success: false };

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Un mot de passe compromis est la raison la plus probable d'une
  // réinitialisation : toute session existante ailleurs doit mourir.
  await prisma.session.deleteMany({ where: { userId } });

  return { error: null, success: true };
}
