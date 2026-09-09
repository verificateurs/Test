"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

export type OrderActionState = { error: string | null };

// REFUNDED n'est volontairement pas une valeur sélectionnable ici : ce statut
// ne doit refléter qu'un remboursement Stripe réellement effectué (voir
// refundOrderAction ci-dessous), jamais une simple étiquette posée à la main
// qui laisserait croire à un client remboursé sans qu'il le soit.
const StatusSchema = z.object({ status: z.enum(["PENDING", "PAID", "SHIPPED", "CANCELLED"]) });

export async function updateOrderStatusAction(_prev: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Commande invalide." };

  const parsed = StatusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) return { error: "Statut invalide." };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Commande introuvable." };

  await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
  redirect(`/admin/commandes/${id}`);
}

export async function refundOrderAction(_prev: OrderActionState, formData: FormData): Promise<OrderActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Commande invalide." };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "PAID") return { error: "Seule une commande payée peut être remboursée." };
  if (!isStripeConfigured()) return { error: "Stripe non configuré (mode démonstration) — remboursement indisponible." };
  if (!order.stripePaymentIntentId) return { error: "Aucun paiement Stripe associé à cette commande, remboursement impossible." };

  const stripe = getStripeClient();
  try {
    await stripe.refunds.create({ payment_intent: order.stripePaymentIntentId });
  } catch (err) {
    // Un double clic (remboursement déjà effectué), un solde Stripe
    // insuffisant, une coupure réseau... : Stripe rejette avec un message
    // déjà présentable (StripeError#message), jamais une trace technique.
    // Sans ce catch, la Server Action plante au lieu de renvoyer state.error,
    // et le statut de la commande resterait PAID de toute façon — c'est
    // seulement le message à l'admin qui change ici.
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return { error: `Le remboursement Stripe a échoué : ${message}` };
  }
  await prisma.order.update({ where: { id }, data: { status: "REFUNDED" } });
  redirect(`/admin/commandes/${id}`);
}
