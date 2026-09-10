"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export async function createPromoAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.object({
    code: z.string().min(1).max(50).toUpperCase(),
    discountPercent: z.coerce.number().int().min(1).max(99),
    maxUses: z.coerce.number().int().min(1).max(99999),
  }).safeParse(Object.fromEntries(fd));

  if (!parsed.success) return;

  await db.promo.create({ data: parsed.data });
  revalidatePath("/admin/promos");
}

export async function deletePromoAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const id = fd.get("id");
  if (typeof id !== "string" || !id) return;

  await db.promo.delete({ where: { id } });
  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}
