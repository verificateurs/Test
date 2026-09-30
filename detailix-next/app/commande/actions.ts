"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { computePrice } from "@/lib/pricing";
import { checkRateLimit } from "@/lib/rate-limit";

const lineSchema = z.object({
  productId: z.string().min(1).max(100),
  qty: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  items: z.array(lineSchema).min(1).max(50),
  promo: z.string().max(50).optional(),
});

type CheckoutState = { error: string } | null;

// Marque les erreurs métier volontairement renvoyées telles quelles au client
// (stock, promo, produit introuvable). Toute erreur non marquée (ex: un
// message Prisma brut sur un incident inattendu) est remplacée par un message
// générique avant de sortir de l'action — voir le catch plus bas.
class CheckoutError extends Error {}

export async function createOrderAction(
  _prev: CheckoutState,
  fd: FormData
): Promise<CheckoutState> {
  // This action requires no authentication (guest checkout), so it is only
  // protected by rate limiting. x-forwarded-for is client-controlled unless
  // a trusted proxy rewrites it (see lib/rate-limit.ts).
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`checkout:${ip}`);
  if (!allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

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

  // Aggregate quantities by productId first: two cart lines for the same
  // product must not each pass an independent stock check and each
  // decrement stock separately, which could drive stock negative.
  const qtyByProductId = new Map<string, number>();
  for (const item of items) {
    qtyByProductId.set(item.productId, (qtyByProductId.get(item.productId) ?? 0) + item.qty);
  }

  // Fast-fail promo validation outside the transaction. The actual usedCount
  // increment is done atomically inside the transaction below (conditional
  // updateMany) to avoid a race between concurrent checkouts exhausting
  // maxUses.
  let promoRecord: { id: string; discountPercent: number; maxUses: number } | null = null;
  if (promo) {
    const record = await db.promo.findUnique({ where: { code: promo } });
    const now = new Date();
    if (
      !record ||
      !record.active ||
      (record.expiresAt && record.expiresAt <= now) ||
      record.usedCount >= record.maxUses
    ) {
      return { error: "Code promo invalide ou expiré." };
    }
    promoRecord = { id: record.id, discountPercent: record.discountPercent, maxUses: record.maxUses };
  }

  // Atomic transaction: check stock, decrement, reserve promo use, create order
  let orderId: string;
  try {
    const order = await db.$transaction(async (tx) => {
      const productIds = [...qtyByProductId.keys()];
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, prixAchat: true, stockQty: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Validate stock against the aggregated (per-product) quantities
      // before any write.
      for (const [productId, qty] of qtyByProductId) {
        const product = productMap.get(productId);
        if (!product) throw new CheckoutError(`Produit introuvable: ${productId}`);
        if (product.stockQty < qty) throw new CheckoutError(`Stock insuffisant: ${product.name}`);
      }

      // Decrement stock once per product with the aggregated quantity. Uses
      // a conditional update (rather than check-then-write) so concurrent
      // checkouts can't both pass the check above and both decrement.
      for (const [productId, qty] of qtyByProductId) {
        const product = productMap.get(productId)!;
        const { count } = await tx.product.updateMany({
          where: { id: productId, stockQty: { gte: qty } },
          data: { stockQty: { decrement: qty } },
        });
        if (count !== 1) throw new CheckoutError(`Stock insuffisant: ${product.name}`);
      }

      let discountPercent = 0;
      if (promoRecord) {
        const { count } = await tx.promo.updateMany({
          where: {
            id: promoRecord.id,
            active: true,
            usedCount: { lt: promoRecord.maxUses },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (count !== 1) throw new CheckoutError("Code promo invalide ou expiré.");
        discountPercent = promoRecord.discountPercent;
      }

      // Compute total from the original (non-aggregated) line items so the
      // order keeps one OrderItem row per submitted cart line.
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
    // Seules les erreurs métier volontaires (CheckoutError) remontent leur message
    // au client — tout le reste (erreur Prisma inattendue, timeout...) est loggé
    // côté serveur et remplacé par un message générique pour ne rien exposer.
    if (!(err instanceof CheckoutError)) console.error("Erreur checkout inattendue:", err);
    const msg = err instanceof CheckoutError ? err.message : "Erreur lors de la commande, réessayez.";
    return { error: msg };
  }

  // `fresh=1` tells the confirmation page this is a just-placed order (as
  // opposed to a past order viewed from /compte), so it knows it's safe to
  // clear the client-side cart.
  redirect(`/commande/confirmation/${orderId}?fresh=1`);
}
