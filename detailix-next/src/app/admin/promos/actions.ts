"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";

export type PromoActionState = { error: string | null };

const PromoSchema = z.object({
  code: z.string().trim().toUpperCase().min(3, "3 caractères minimum").max(40),
  type: z.enum(["FIXED", "PERCENT"]),
  value: z.coerce.number().positive("La valeur doit être positive"),
  minSubtotal: z.coerce.number().min(0),
  freeShipping: z.coerce.boolean(),
  active: z.coerce.boolean(),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null)),
});

export async function createPromoAction(_prev: PromoActionState, formData: FormData): Promise<PromoActionState> {
  await requireAdmin();
  const parsed = PromoSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal"),
    freeShipping: formData.get("freeShipping") === "on",
    active: formData.get("active") === "on",
    expiresAt: formData.get("expiresAt") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  if (parsed.data.type === "PERCENT" && parsed.data.value > 100) return { error: "Un pourcentage ne peut pas dépasser 100." };

  const existing = await prisma.promoCode.findUnique({ where: { code: parsed.data.code } });
  if (existing) return { error: `Le code "${parsed.data.code}" existe déjà.` };

  await prisma.promoCode.create({ data: parsed.data });
  redirect("/admin/promos");
}

export async function togglePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (promo) await prisma.promoCode.update({ where: { id }, data: { active: !promo.active } });
  redirect("/admin/promos");
}

export async function deletePromoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.promoCode.delete({ where: { id } }).catch(() => {});
  redirect("/admin/promos");
}
