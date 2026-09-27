import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

/** Returns the ids from `productIds` that the current visitor has in their wishlist (empty set if not logged in). */
export async function getWishlistedProductIds(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();

  const session = await getSession();
  if (!session) return new Set();

  const items = await db.wishlistItem.findMany({
    where: { userId: session.user.id, productId: { in: productIds } },
    select: { productId: true },
  });
  return new Set(items.map((i) => i.productId));
}
