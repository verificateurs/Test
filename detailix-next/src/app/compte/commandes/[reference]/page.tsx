import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Détail de la commande", robots: { index: false, follow: false } };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  SHIPPED: "Expédiée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export default async function CommandeDetailPage({ params }: { params: Promise<{ reference: string }> }) {
  const user = await requireUser("/compte/commandes");
  const { reference } = await params;

  // La référence seule ne suffit jamais à autoriser l'accès ici : contrairement
  // à la page de confirmation post-achat (accessible sans compte via un jeton
  // non énumérable), une page sous /compte doit rester strictement bornée à
  // l'utilisateur de la session — sinon un client connecté pourrait consulter
  // la commande d'un autre en devinant/rejouant sa référence (IDOR).
  const order = await prisma.order.findFirst({
    where: { reference, userId: user.id },
    include: { lines: true },
  });
  if (!order) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <p className="form-hint">
              <Link href="/compte/commandes">← Mes commandes</Link>
            </p>
            <h1>Commande {order.reference}</h1>
            <p className="section-intro">
              Passée le {order.createdAt.toLocaleString("fr-FR")} — statut : {STATUS_LABELS[order.status] ?? order.status}
            </p>

            <div className="order-summary">
              <h2>Détail</h2>
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

            <div className="order-summary">
              <h2>Livraison</h2>
              <p>{order.shippingName}</p>
              <p>{order.shippingAddr}</p>
              <p>
                {order.shippingZip} {order.shippingCity}
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
