import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Frais de port : identiques pour tout le monde sauf franchise offerte au-delà
 * d'un seuil (réglable en base, Setting.freeShippingThreshold) ou via un code
 * promo marqué freeShipping. Pas de zones/poids dans ce lot — un forfait
 * unique, cohérent avec le catalogue de produits de préparation esthétique.
 */
export const STANDARD_SHIPPING_COST = 5.9;
const DEFAULT_FREE_SHIPPING_THRESHOLD = 79;

export async function getFreeShippingThreshold(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "freeShippingThreshold" } });
  if (!setting) return DEFAULT_FREE_SHIPPING_THRESHOLD;
  const value = Number(setting.value);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_FREE_SHIPPING_THRESHOLD;
}

export function computeShippingCost(subtotal: number, threshold: number, forcedFree: boolean): number {
  if (forcedFree) return 0;
  return subtotal >= threshold ? 0 : STANDARD_SHIPPING_COST;
}

export type PromoValidation =
  | { ok: true; code: string; discount: number; freeShipping: boolean }
  | { ok: false; message: string };

/** Recherche et valide un code promo contre le sous-total déjà recalculé serveur. */
export async function validatePromoCode(rawCode: string | undefined, subtotal: number): Promise<PromoValidation | null> {
  if (!rawCode) return null;
  const promo = await prisma.promoCode.findUnique({ where: { code: rawCode } });
  if (!promo || !promo.active) return { ok: false, message: "Code promo invalide." };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: "Ce code promo a expiré." };
  }
  if (subtotal < promo.minSubtotal) {
    return {
      ok: false,
      message: `Ce code promo nécessite un panier d'au moins ${promo.minSubtotal.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}.`,
    };
  }
  const rawDiscount = promo.type === "PERCENT" ? (subtotal * promo.value) / 100 : promo.value;
  // Jamais de remise négative ni supérieure au sous-total.
  const discount = Math.min(Math.max(rawDiscount, 0), subtotal);
  return { ok: true, code: promo.code, discount: Math.round(discount * 100) / 100, freeShipping: promo.freeShipping };
}
