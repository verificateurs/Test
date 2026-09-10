"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";

export async function updateUserRoleAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const parsed = z.object({
    id: z.string().min(1),
    role: z.enum(["USER", "PRO", "ADMIN"]),
  }).safeParse({ id: fd.get("id"), role: fd.get("role") });

  if (!parsed.success) return;

  // Prevent self-demotion
  const session = await getSession();
  if (session?.userId === parsed.data.id && parsed.data.role !== "ADMIN") return;

  await db.user.update({ where: { id: parsed.data.id }, data: { role: parsed.data.role } });
  revalidatePath("/admin/utilisateurs");
}
