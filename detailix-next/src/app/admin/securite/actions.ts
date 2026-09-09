"use server";

import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { generateTotpSecret, totpUri, verifyTotpCode } from "@/lib/auth/totp";
import { TotpCodeSchema } from "@/lib/auth/schemas";

export type GenerateTotpResult = { secret: string; qrDataUri: string };

/**
 * Appelable directement depuis le composant client (comme
 * addToWishlistAction), pas de <form> : ce n'est pas une soumission
 * utilisateur mais une préparation d'état côté serveur avant affichage du QR
 * code. Le secret est persisté tout de suite (totpEnabled reste false) pour
 * survivre à un rechargement de page avant confirmation ; confirmTotpAction
 * relit ce même secret en base plutôt que de faire confiance à une valeur
 * renvoyée par le client.
 */
export async function generateTotpSecretAction(): Promise<GenerateTotpResult> {
  const admin = await requireAdmin();
  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: admin.id }, data: { totpSecret: secret, totpEnabled: false } });

  const qrDataUri = await QRCode.toDataURL(totpUri(secret, admin.email));
  return { secret, qrDataUri };
}

export type ConfirmTotpState = { error: string | null };

export async function confirmTotpAction(_prev: ConfirmTotpState, formData: FormData): Promise<ConfirmTotpState> {
  const admin = await requireAdmin();
  const parsed = TotpCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Code invalide." };

  const current = await prisma.user.findUnique({ where: { id: admin.id }, select: { totpSecret: true } });
  if (!current?.totpSecret || !verifyTotpCode(current.totpSecret, parsed.data.code)) {
    return { error: "Code invalide." };
  }

  await prisma.user.update({ where: { id: admin.id }, data: { totpEnabled: true } });
  redirect("/admin/securite");
}

export async function disableTotpAction(): Promise<void> {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: admin.id }, data: { totpEnabled: false, totpSecret: null } });
  redirect("/admin/securite");
}
