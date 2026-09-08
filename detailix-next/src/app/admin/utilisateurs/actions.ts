"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";

const RoleSchema = z.object({ role: z.enum(["CUSTOMER", "PRO", "ADMIN"]) });

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const parsed = RoleSchema.safeParse({ role: formData.get("role") });
  if (!userId || !parsed.success) redirect("/admin/utilisateurs?erreur=Donn%C3%A9es+invalides");

  // Un admin ne peut pas se rétrograder lui-même par erreur et se retrouver
  // hors de son propre panel (pas de garde-fou multi-admin dans ce lot).
  if (userId === admin.id && parsed.data.role !== "ADMIN") {
    redirect("/admin/utilisateurs?erreur=Impossible+de+retirer+votre+propre+r%C3%B4le+admin");
  }

  await prisma.user.update({ where: { id: userId }, data: { role: parsed.data.role } });
  redirect("/admin/utilisateurs");
}
