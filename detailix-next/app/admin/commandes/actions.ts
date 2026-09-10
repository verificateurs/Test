"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export async function updateOrderStatusAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.object({
    id: z.string().min(1),
    status: z.enum(["pending", "paid", "shipped", "cancelled"]),
  }).safeParse({ id: fd.get("id"), status: fd.get("status") });

  if (!parsed.success) return;

  await db.order.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  revalidatePath("/admin/commandes");
}
