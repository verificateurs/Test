import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalogue";
import { StatusForm } from "./StatusForm";
import { RefundForm } from "./RefundForm";

export const metadata: Metadata = { title: "Détail commande", robots: { index: false } };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { lines: true, user: true } });
  if (!order) notFound();

  return (
    <div>
      <h1>Commande {order.reference}</h1>

      <div className="admin-card">
        {/* <form> n'est pas un contenu phrasant valide dans <p> — un <div> évite
            la renormalisation DOM par le navigateur qui provoquait une erreur
            d'hydratation React sur StatusForm/RefundForm. */}
        <div className="admin-detail-row">
          <strong>Statut :</strong> <StatusForm id={order.id} status={order.status} />
        </div>
        <p>
          <strong>Client :</strong> {order.email} {order.user ? `(compte : ${order.user.displayName})` : "(invité)"}
        </p>
        <p>
          <strong>Livraison :</strong> {order.shippingName}, {order.shippingAddr}, {order.shippingZip} {order.shippingCity}
        </p>
        <p>
          <strong>Créée le :</strong> {order.createdAt.toLocaleString("fr-FR")}
        </p>
        {order.stripeSession && (
          <p>
            <strong>Session Stripe :</strong> {order.stripeSession}
          </p>
        )}
        {order.status === "PAID" && (
          <div className="admin-detail-row">
            <strong>Remboursement :</strong> <RefundForm id={order.id} />
          </div>
        )}
      </div>

      <div className="order-summary">
        <h2>Lignes</h2>
        <ul className="order-summary-lines">
          {order.lines.map((line) => (
            <li key={line.id}>
              <span>
                {line.qty} × {line.name} ({line.format})
              </span>
              <span>{formatPrice(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <p className="order-summary-subtotal">
          Sous-total <span>{formatPrice(order.subtotal)}</span>
        </p>
        {order.discount > 0 && (
          <p className="order-summary-subtotal">
            Remise{order.promoCode ? ` (${order.promoCode})` : ""} <span>-{formatPrice(order.discount)}</span>
          </p>
        )}
        <p className="order-summary-subtotal">
          Livraison <span>{order.shippingCost === 0 ? "Offerte" : formatPrice(order.shippingCost)}</span>
        </p>
        <p className="order-summary-total">
          Total <span>{formatPrice(order.total)}</span>
        </p>
      </div>
    </div>
  );
}
