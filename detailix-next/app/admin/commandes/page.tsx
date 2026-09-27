import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatusAction } from "./actions";
import { StatusSelect } from "./StatusSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

export default async function AdminOrders() {
  await requireAdmin();

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: { select: { qty: true } },
      user: { select: { email: true } },
    },
  });

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Commandes ({orders.length})</h1>

      <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Client</th>
            <th>Total TTC</th>
            <th>Articles</th>
            <th>Statut</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/commandes/${o.id}`}
                  style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: "var(--text-xs)" }}>
                  {o.id.slice(0, 12)}…
                </Link>
              </td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {o.user?.email ?? "Invité"}
              </td>
              <td style={{ fontWeight: 600 }}>
                {o.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </td>
              <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td>
                <StatusSelect orderId={o.id} status={o.status} action={updateOrderStatusAction} />
              </td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {o.createdAt.toLocaleDateString("fr-FR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
