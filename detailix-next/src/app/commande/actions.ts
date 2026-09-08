"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getClientIp } from "@/lib/auth/rbac";
import { checkRateLimit, sweepRateLimitBuckets } from "@/lib/auth/rateLimit";
import { getMarginPercent, computeSellPrice } from "@/lib/catalogue";
import { getFreeShippingThreshold, computeShippingCost, validatePromoCode } from "@/lib/checkout/pricing";
import { CartItemsInputSchema, CheckoutSchema } from "@/lib/checkout/schemas";

export type CheckoutActionState = {
  error: string | null;
  values?: { email?: string; shippingName?: string; shippingAddr?: string; shippingZip?: string; shippingCity?: string; promoCode?: string };
};

/** Référence de commande : token aléatoire (72 bits), pas un compteur — la page
 * de confirmation y est accessible sans compte, elle ne doit donc pas être
 * devinable ni énumérable. */
function generateOrderReference(): string {
  return `CMD-${randomBytes(9).toString("base64url").toUpperCase()}`;
}

export async function createOrderAction(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  sweepRateLimitBuckets();
  const ip = await getClientIp();
  const limit = checkRateLimit(`order:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });

  const rawFields = {
    email: String(formData.get("email") ?? ""),
    shippingName: String(formData.get("shippingName") ?? ""),
    shippingAddr: String(formData.get("shippingAddr") ?? ""),
    shippingZip: String(formData.get("shippingZip") ?? ""),
    shippingCity: String(formData.get("shippingCity") ?? ""),
    promoCode: String(formData.get("promoCode") ?? ""),
  };

  if (!limit.allowed) return { error: "Trop de tentatives. Réessayez dans quelques minutes.", values: rawFields };

  const checkoutParsed = CheckoutSchema.safeParse(rawFields);
  if (!checkoutParsed.success) {
    return { error: checkoutParsed.error.issues[0]?.message ?? "Formulaire invalide", values: rawFields };
  }

  let cartItemsRaw: unknown;
  try {
    cartItemsRaw = JSON.parse(String(formData.get("cartItems") ?? "[]"));
  } catch {
    return { error: "Panier illisible, merci de réessayer.", values: rawFields };
  }
  const cartParsed = CartItemsInputSchema.safeParse(cartItemsRaw);
  if (!cartParsed.success) {
    return { error: cartParsed.error.issues[0]?.message ?? "Panier invalide.", values: rawFields };
  }

  // Dédoublonne par sécurité (même productId envoyé deux fois) en sommant les quantités.
  const qtyByProduct = new Map<string, number>();
  for (const item of cartParsed.data) {
    qtyByProduct.set(item.productId, Math.min((qtyByProduct.get(item.productId) ?? 0) + item.qty, 99));
  }

  const products = await prisma.product.findMany({ where: { id: { in: [...qtyByProduct.keys()] } } });
  if (products.length === 0) {
    return { error: "Ces produits ne sont plus disponibles. Videz le panier et recommencez.", values: rawFields };
  }

  const marginPercent = await getMarginPercent();
  // Tout prix vient d'ici, jamais du panier client : un unitPriceSnapshot
  // falsifié en localStorage n'a donc aucun effet sur le montant facturé.
  const lines = products.map((product) => {
    const qty = qtyByProduct.get(product.id)!;
    const unitPrice = computeSellPrice(product.prixAchat, marginPercent);
    return {
      productId: product.id,
      name: product.name,
      format: product.format,
      unitPrice,
      qty,
      lineTotal: Math.round(unitPrice * qty * 100) / 100,
    };
  });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  const promo = await validatePromoCode(checkoutParsed.data.promoCode, subtotal);
  if (promo && !promo.ok) {
    return { error: promo.message, values: rawFields };
  }

  const threshold = await getFreeShippingThreshold();
  const shippingCost = computeShippingCost(subtotal, threshold, promo?.ok === true && promo.freeShipping);
  const discount = promo?.ok ? promo.discount : 0;
  const total = Math.max(0, Math.round((subtotal - discount + shippingCost) * 100) / 100);

  const session = await getSession();

  const order = await prisma.order.create({
    data: {
      reference: generateOrderReference(),
      status: "PENDING",
      email: checkoutParsed.data.email,
      shippingName: checkoutParsed.data.shippingName,
      shippingAddr: checkoutParsed.data.shippingAddr,
      shippingZip: checkoutParsed.data.shippingZip,
      shippingCity: checkoutParsed.data.shippingCity,
      subtotal,
      shippingCost,
      discount,
      total,
      promoCode: promo?.ok ? promo.code : null,
      userId: session?.user.id,
      lines: { create: lines },
    },
  });

  redirect(`/commande/confirmation/${order.reference}`);
}
