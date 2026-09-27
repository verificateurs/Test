import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { updateOrderStatusAction } from "../actions";
import { StatusSelect } from "../StatusSelect";

export const dynamic = "force-dynamic";
export const metadata = { title: "Détail commande" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true } },
      items: { include: { product: { select: { id: true, name: true } } } },
    },
  });

  if (!order) notFound();

  const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      <div style={{ marginBottom: "var(--space-xl)" }}>
        <Link href="/admin/commandes" style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>← Toutes les commandes</Link>
        <h1 style={{ marginTop: "var(--space-sm)", fontFamily: "monospace", fontSize: "var(--text-xl)" }}>{order.id}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-md)", marginBottom: "var(--space-xl)" }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>Client</div>
          <div>{order.user?.email ?? "Invité"}</div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>Total TTC</div>
          <div style={{ fontWeight: 700, color: "var(--accent)" }}>
            {order.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>Passée le</div>
          <div>{order.createdAt.toLocaleString("fr-FR")}</div>
        </div>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>Statut</div>
          <StatusSelect orderId={order.id} status={order.status} action={updateOrderStatusAction} />
        </div>
      </div>

      {(order.shippingName || order.shippingAddress) && (
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)", marginBottom: "var(--space-xl)" }}>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>Livraison</div>
          {order.shippingName && <div>{order.shippingName}</div>}
          {order.shippingAddress && <div style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{order.shippingAddress}</div>}
        </div>
      )}

      <h2 style={{ marginBottom: "var(--space-lg)" }}>Articles ({totalQty})</h2>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Prix unitaire</th>
              <th>Quantité</th>
              <th>Sous-total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/produits/${item.product.id}`} target="_blank" style={{ color: "var(--text)" }}>{item.product.name}</Link>
                </td>
                <td>{item.unitPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
                <td>{item.qty}</td>
                <td style={{ fontWeight: 600 }}>
                  {(item.unitPrice * item.qty).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
