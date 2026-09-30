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
  const { id, status } = parsed.data;

  await db.$transaction(async (tx) => {
    // Conditional update (status != "cancelled" in the WHERE) so two concurrent
    // cancellations of the same order can't both pass and restock twice.
    const { count } = await tx.order.updateMany({
      where: { id, status: { not: "cancelled" } },
      data: { status },
    });

    if (status === "cancelled" && count === 1) {
      // Restock — a cancelled order (checkout never required real payment,
      // see "Demo mode") must not permanently drain stock. No promo re-credit
      // here: Order doesn't currently track which Promo (if any) was applied
      // at checkout, so Promo.usedCount can't be decremented accurately yet.
      const items = await tx.orderItem.findMany({ where: { orderId: id }, select: { productId: true, qty: true } });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.qty } },
        });
      }
    } else if (count === 0) {
      // Already cancelled, or id doesn't exist — no-op update for any other status change.
      await tx.order.updateMany({ where: { id }, data: { status } });
    }
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${id}`);
}
