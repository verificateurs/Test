"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getClientIp } from "@/lib/auth/rbac";
import { checkRateLimit, sweepRateLimitBuckets } from "@/lib/auth/rateLimit";
import { getMarginPercent, computeSellPrice } from "@/lib/catalogue";
import { getFreeShippingThreshold, computeShippingCost, validatePromoCode, getProDiscountPercent } from "@/lib/checkout/pricing";
import { CartItemsInputSchema, CheckoutSchema } from "@/lib/checkout/schemas";
import type Stripe from "stripe";
import { isStripeConfigured, getStripeClient } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

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

/** Portée volontairement au module : distinguée d'une erreur Prisma
 * inattendue dans le catch de createOrderAction, pour renvoyer un message
 * utilisateur clair plutôt que de laisser planter l'action. */
class InsufficientStockError extends Error {
  constructor(public readonly productName: string) {
    super(`Stock insuffisant pour "${productName}"`);
  }
}

export async function createOrderAction(_prev: CheckoutActionState, formData: FormData): Promise<CheckoutActionState> {
  sweepRateLimitBuckets();
  const ip = await getClientIp();
  const limit = await checkRateLimit(`order:ip:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });

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
  const session = await getSession();

  const promo = await validatePromoCode(checkoutParsed.data.promoCode, subtotal);
  if (promo && !promo.ok) {
    return { error: promo.message, values: rawFields };
  }

  // Remise pro : uniquement à partir du rôle de la session serveur — jamais
  // d'un champ envoyé par le client. Cumulée avec un éventuel code promo,
  // plafonnée pour ne jamais dépasser le sous-total.
  let proDiscount = 0;
  if (session?.user.role === "PRO") {
    const proDiscountPercent = await getProDiscountPercent();
    proDiscount = Math.round(((subtotal * proDiscountPercent) / 100) * 100) / 100;
  }

  const promoDiscount = promo?.ok ? promo.discount : 0;
  const discount = Math.min(promoDiscount + proDiscount, subtotal);

  const threshold = await getFreeShippingThreshold();
  const shippingCost = computeShippingCost(subtotal, threshold, promo?.ok === true && promo.freeShipping);
  const total = Math.max(0, Math.round((subtotal - discount + shippingCost) * 100) / 100);

  // Décrément atomique par ligne : updateMany conditionné sur stockQty >= qty
  // (comme le jeton de réinitialisation à usage unique — voir
  // passwordReset.ts) évite qu'une commande concurrente ne fasse passer le
  // stock sous zéro entre la lecture et l'écriture. Sur SQLite, l'écriture
  // mono-fichier sérialise déjà les accès ; cette garantie ne devient
  // réellement porteuse de sens qu'après une bascule Postgres (non planifiée
  // ici), mais le code est écrit pour être correct dans les deux cas.
  // Limite connue : le stock est réservé dès la création de la commande, y
  // compris pour une session Stripe Checkout jamais finalisée par le client
  // (pas de mécanisme d'expiration/restauration dans ce lot) — acceptable en
  // mode démonstration, à revoir avant une mise en production avec Stripe actif.
  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const decremented = await tx.product.updateMany({
          where: { id: line.productId, stockQty: { gte: line.qty } },
          data: { stockQty: { decrement: line.qty } },
        });
        if (decremented.count === 0) throw new InsufficientStockError(line.name);
      }

      return tx.order.create({
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
        include: { lines: true },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return {
        error: `Stock insuffisant pour "${err.productName}". Ajustez la quantité dans votre panier et réessayez.`,
        values: rawFields,
      };
    }
    throw err;
  }

  // Sans clé Stripe (dev / test utilisateurs sans compte de paiement réel) :
  // repli explicite et visible plutôt qu'un faux succès silencieux. La
  // commande est marquée payée directement — jamais depuis la page de
  // confirmation elle-même, qui reste strictement en lecture seule.
  if (!isStripeConfigured()) {
    const paidOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
      include: { lines: true },
    });
    await sendOrderConfirmationEmail(paidOrder);
    redirect(`/commande/confirmation/${order.reference}`);
  }

  // Session Checkout hébergée par Stripe, créée côté serveur uniquement — la
  // clé secrète ne quitte jamais ce fichier, aucun Stripe.js côté client.
  // Les montants viennent des lignes déjà recalculées ci-dessus, jamais du
  // panier envoyé par le client. La commande n'est marquée PAID que par le
  // webhook signé (voir api/stripe/webhook/route.ts), jamais par ce redirect.
  const stripe = getStripeClient();

  // Nos codes promo sont des enregistrements internes (PromoCode), pas des
  // objets Stripe. Pour appliquer la même remise déjà calculée côté serveur
  // sans dupliquer les codes dans Stripe, on crée un coupon Stripe ad hoc
  // (montant fixe, usage unique) juste avant la session.
  let discountParam: Stripe.Checkout.SessionCreateParams["discounts"];
  if (discount > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: Math.round(discount * 100),
      currency: "eur",
      duration: "once",
      name: promo?.ok ? `Code promo ${promo.code}` : "Remise",
    });
    discountParam = [{ coupon: coupon.id }];
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: checkoutParsed.data.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderReference: order.reference },
    line_items: order.lines.map((line) => ({
      quantity: line.qty,
      price_data: {
        currency: "eur",
        unit_amount: Math.round(line.unitPrice * 100),
        product_data: { name: `${line.name} (${line.format})` },
      },
    })),
    shipping_options:
      shippingCost > 0
        ? [{ shipping_rate_data: { type: "fixed_amount", fixed_amount: { amount: Math.round(shippingCost * 100), currency: "eur" }, display_name: "Livraison standard" } }]
        : undefined,
    discounts: discountParam,
    success_url: absoluteUrl(`/commande/confirmation/${order.reference}`),
    cancel_url: absoluteUrl("/commande"),
  });

  await prisma.order.update({ where: { id: order.id }, data: { stripeSession: checkoutSession.id } });

  if (!checkoutSession.url) {
    return { error: "Impossible de créer la session de paiement. Réessayez.", values: rawFields };
  }
  redirect(checkoutSession.url);
}
