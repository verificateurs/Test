import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ClearCartOnMount } from "../ClearCartOnMount";

export const metadata: Metadata = { title: "Commande confirmée", robots: { index: false, follow: false } };

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Page dynamique : la référence est un jeton aléatoire non énumérable (voir
// generateOrderReference dans ../actions.ts), c'est ce qui protège l'accès
// sans exiger de compte pour une confirmation juste après achat.
export default async function ConfirmationPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await prisma.order.findUnique({ where: { reference }, include: { lines: true } });
  if (!order) notFound();

  return (
    <>
      <SiteHeader />
      <ClearCartOnMount />
      <main>
        <section className="section">
          <div className="container">
            <h1>Commande enregistrée</h1>
            <p className="section-intro">
              Référence : <strong>{order.reference}</strong> — un email de confirmation sera envoyé à {order.email}.
            </p>
            <p className="checkout-demo-banner">
              Mode démonstration : le paiement en ligne réel n&apos;est pas encore activé sur ce lot. Aucune somme n&apos;a
              été prélevée.
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
