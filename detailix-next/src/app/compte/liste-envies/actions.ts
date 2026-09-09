"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, sweepRateLimitBuckets } from "@/lib/auth/rateLimit";

export type WishlistResult = { ok: boolean; error?: string };

/**
 * Appelable directement depuis un composant client (pas seulement via un
 * <form>) — Next l'autorise pour toute fonction "use server" exportée. Pas
 * de redirect() ici : le bouton est déjà masqué pour un visiteur non connecté
 * (voir WishlistToggleButton), donc un appel sans session est traité comme
 * une erreur silencieuse plutôt qu'une navigation surprise.
 *
 * Rate-limité par utilisateur (pas par IP comme login/signup/checkout) :
 * c'est une action authentifiée, un décompte par IP pénaliserait à tort
 * plusieurs comptes partageant une même IP. Écrit en base à chaque appel
 * (upsert) sans autre protection, un client scripté pourrait sinon
 * enchaîner les appels sans limite.
 */
export async function addToWishlistAction(productId: string): Promise<WishlistResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Connectez-vous pour ajouter un produit à votre liste d'envies." };

  sweepRateLimitBuckets();
  const limit = await checkRateLimit(`wishlist:user:${session.user.id}`, { max: 30, windowMs: 5 * 60 * 1000 });
  if (!limit.allowed) return { ok: false, error: "Trop de tentatives, réessayez dans quelques minutes." };

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
