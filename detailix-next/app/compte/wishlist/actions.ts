"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

const productIdSchema = z.string().min(1).max(100);

export async function addToWishlistAction(productId: string): Promise<void> {
  const user = await requireUser();
  const id = productIdSchema.parse(productId);

  try {
    await db.wishlistItem.create({ data: { userId: user.id, productId: id } });
  } catch (e: unknown) {
    if ((e as { code?: string }).code !== "P2002") throw e;
  }

  revalidatePath("/compte/wishlist");
  revalidatePath(`/produits/${id}`);
}

export async function removeFromWishlistAction(productId: string): Promise<void> {
  const user = await requireUser();
  const id = productIdSchema.parse(productId);

  try {
    await db.wishlistItem.delete({
      where: { userId_productId: { userId: user.id, productId: id } },
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code !== "P2025") throw e;
  }

  revalidatePath("/compte/wishlist");
  revalidatePath(`/produits/${id}`);
}
