import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/catalogue";

export const metadata: Metadata = { title: "Commandes", robots: { index: false } };

const STATUS_LABELS: Record<string, string> = { PENDING: "En attente", PAID: "Payée", SHIPPED: "Expédiée", CANCELLED: "Annulée" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <h1>Commandes ({orders.length})</h1>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Date</th>
            <th>Client</th>
            <th>Total</th>
            <th>Statut</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.reference}</td>
              <td>{o.createdAt.toLocaleString("fr-FR")}</td>
              <td>{o.email}</td>
              <td>{formatPrice(o.total)}</td>
              <td>{STATUS_LABELS[o.status] ?? o.status}</td>
              <td>
                <Link href={`/admin/commandes/${o.id}`}>Voir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
