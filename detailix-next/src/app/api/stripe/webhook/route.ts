import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { sendOrderConfirmationEmail } from "@/lib/email";

/**
 * Seule route non couverte par la protection CSRF native des Server Actions —
 * elle n'a pas besoin de l'être : Stripe l'appelle serveur-à-serveur, jamais
 * depuis un navigateur, et chaque requête est authentifiée par la signature
 * `Stripe-Signature` vérifiée ci-dessous (jamais par un cookie/session).
 *
 * C'est le SEUL endroit qui marque une commande PAID pour le flux Stripe —
 * jamais la page de confirmation, jamais un simple retour de redirection
 * navigateur (falsifiable), pour éviter qu'un client détourne success_url
 * sans avoir réellement payé.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isStripeConfigured()) return NextResponse.json({ error: "Stripe non configuré" }, { status: 404 });

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] Signature invalide :", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id;
    if (!orderId) {
      console.error("[stripe webhook] Session sans orderId associé :", session.id);
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { lines: true } });
    if (!order) {
      console.error("[stripe webhook] Commande introuvable pour orderId :", orderId);
      return NextResponse.json({ received: true });
    }

    // Idempotent : un webhook peut être livré plusieurs fois (Stripe retry).
    if (order.status !== "PAID") {
      const paidOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", stripeSession: session.id },
        include: { lines: true },
      });
      await sendOrderConfirmationEmail(paidOrder);
    }
  }

  return NextResponse.json({ received: true });
}
