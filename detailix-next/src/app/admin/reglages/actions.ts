"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { invalidateMarginCache } from "@/lib/catalogue";
import { revalidateCatalogue } from "@/lib/admin/revalidate";

export type SettingsActionState = { error: string | null; success: boolean };

const SettingsSchema = z.object({
  marginPercent: z.coerce.number().min(0, "La marge ne peut pas être négative").max(500, "Marge invraisemblable"),
  freeShippingThreshold: z.coerce.number().min(0, "Le seuil ne peut pas être négatif"),
});

export async function updateSettingsAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  // Défense en profondeur : cette action reste en principe invocable
  // directement (son id est exposé au client) même si le layout admin filtre
  // déjà l'accès à /admin. Chaque action admin revérifie donc requireAdmin().
  await requireAdmin();

  const parsed = SettingsSchema.safeParse({
    marginPercent: formData.get("marginPercent"),
    freeShippingThreshold: formData.get("freeShippingThreshold"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide", success: false };

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: "marginPercent" },
      create: { key: "marginPercent", value: String(parsed.data.marginPercent) },
      update: { value: String(parsed.data.marginPercent) },
    }),
    prisma.setting.upsert({
      where: { key: "freeShippingThreshold" },
      create: { key: "freeShippingThreshold", value: String(parsed.data.freeShippingThreshold) },
      update: { value: String(parsed.data.freeShippingThreshold) },
    }),
  ]);

  invalidateMarginCache();
  revalidateCatalogue();

  return { error: null, success: true };
}
