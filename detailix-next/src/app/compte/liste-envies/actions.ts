"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export type WishlistResult = { ok: boolean; error?: string };

/**
 * Appelable directement depuis un composant client (pas seulement via un
 * <form>) — Next l'autorise pour toute fonction "use server" exportée. Pas
 * de redirect() ici : le bouton est déjà masqué pour un visiteur non connecté
 * (voir WishlistToggleButton), donc un appel sans session est traité comme
 * une erreur silencieuse plutôt qu'une navigation surprise.
 */
export async function addToWishlistAction(productId: string): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Connectez-vous pour ajouter un produit à votre liste d'envies." };

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) return { ok: false, error: "Produit introuvable." };

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  });

  return { ok: true };
}

export async function removeFromWishlistAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/connexion?next=%2Fcompte%2Fliste-envies");

  const productId = String(formData.get("productId") ?? "");
  if (productId) {
    await prisma.wishlistItem.deleteMany({ where: { userId: session.user.id, productId } });
  }
  redirect("/compte/liste-envies");
}
