import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée",
  SHIPPED: "Expédiée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export default async function MesCommandesPage() {
  const user = await requireUser("/compte/commandes");

  // Toujours filtré par l'utilisateur de la session — jamais par un
  // identifiant pris dans l'URL, pour ne dépendre d'aucun secret devinable.
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Mes commandes</h1>
            {orders.length === 0 ? (
              <p className="section-intro">
                Vous n&apos;avez pas encore passé de commande. <Link href="/categories">Parcourir le catalogue</Link>.
              </p>
            ) : (
              <div className="cart-table-wrap">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th aria-label="Détail" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.reference}</td>
                        <td>{o.createdAt.toLocaleDateString("fr-FR")}</td>
                        <td>{formatPrice(o.total)}</td>
                        <td>{STATUS_LABELS[o.status] ?? o.status}</td>
                        <td>
                          <Link href={`/compte/commandes/${o.reference}`}>Voir le détail</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
