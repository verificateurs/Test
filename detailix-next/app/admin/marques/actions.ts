"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export async function updateBrandRatingAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.object({
    id: z.string().min(1),
    rating: z.coerce.number().min(0).max(5),
  }).safeParse({ id: fd.get("id"), rating: fd.get("rating") });

  if (!parsed.success) return;

  await db.brand.update({ where: { id: parsed.data.id }, data: { rating: parsed.data.rating } });
  revalidatePath("/admin/marques");
  revalidatePath(`/marques/${parsed.data.id}`);
}

export async function toggleBrandRecommendedAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const id = fd.get("id");
  if (typeof id !== "string" || !id) return;

  const brand = await db.brand.findUnique({ where: { id }, select: { recommended: true } });
  if (!brand) return;

  await db.brand.update({ where: { id }, data: { recommended: !brand.recommended } });
  revalidatePath("/admin/marques");
  revalidatePath(`/marques/${id}`);
}
