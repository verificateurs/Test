"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { computePrice } from "@/lib/pricing";

const lineSchema = z.object({
  productId: z.string().min(1).max(100),
  qty: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  items: z.array(lineSchema).min(1).max(50),
  promo: z.string().max(50).optional(),
});

type CheckoutState = { error: string } | null;

export async function createOrderAction(
  _prev: CheckoutState,
  fd: FormData
): Promise<CheckoutState> {
  const session = await getSession();
  const userId = session?.userId ?? null;

  const rawItems = fd.get("items");
  if (typeof rawItems !== "string") return { error: "Panier invalide." };

  let parsedItems: unknown;
  try {
    parsedItems = JSON.parse(rawItems);
  } catch {
    return { error: "Panier invalide." };
  }

  const parsed = checkoutSchema.safeParse({ items: parsedItems, promo: fd.get("promo") ?? undefined });
  if (!parsed.success) return { error: "Données invalides." };

  const { items, promo } = parsed.data;

  // Validate promo code if provided
  let discountPercent = 0;
  if (promo) {
    const promoRecord = await db.promo.findUnique({ where: { code: promo } });
    if (!promoRecord || !promoRecord.active) return { error: "Code promo invalide ou expiré." };
    discountPercent = promoRecord.discountPercent;
  }

  // Atomic transaction: check stock, decrement, create order
  let orderId: string;
  try {
    const order = await db.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, prixAchat: true, stockQty: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate all items before any write
      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) throw new Error(`Produit introuvable: ${item.productId}`);
        if (product.stockQty < item.qty) throw new Error(`Stock insuffisant: ${product.name}`);
      }

      // Decrement stock for all items
      await Promise.all(
        items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.qty } },
          })
        )
      );

      // Compute total
      const total = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        const price = computePrice(product.prixAchat);
        return sum + price * item.qty;
      }, 0);
      const totalAfterDiscount = total * (1 - discountPercent / 100);

      // Create order
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: Math.round(totalAfterDiscount * 100) / 100,
          status: "pending",
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              const unitPrice = computePrice(product.prixAchat);
              return {
                productId: item.productId,
                qty: item.qty,
                unitPrice: Math.round(unitPrice * 100) / 100,
              };
            }),
          },
        },
      });

      return newOrder;
    });

    orderId = order.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur lors de la commande.";
    return { error: msg };
  }

  redirect(`/commande/confirmation/${orderId}`);
}
