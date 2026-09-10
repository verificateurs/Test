import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatusAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes" };

const STATUS_OPTIONS = ["pending", "paid", "shipped", "cancelled"];

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
                <Link href={`/commande/confirmation/${o.id}`} target="_blank"
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
                <form action={updateOrderStatusAction} style={{ display: "inline" }}>
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status}
                    onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                    style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 8px", fontSize: "var(--text-xs)" }}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </form>
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
