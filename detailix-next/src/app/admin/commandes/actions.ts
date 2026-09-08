"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";

export type OrderActionState = { error: string | null };

const StatusSchema = z.object({ status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]) });

export async function updateOrderStatusAction(_prev: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Commande invalide." };

  const parsed = StatusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) return { error: "Statut invalide." };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Commande introuvable." };

  await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
  redirect(`/admin/commandes/${id}`);
}
