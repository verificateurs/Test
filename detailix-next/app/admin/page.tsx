import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  await requireAdmin();

  const [products, brands, orders, users, pendingOrders] = await Promise.all([
    db.product.count(),
    db.brand.count(),
    db.order.count(),
    db.user.count(),
    db.order.count({ where: { status: "pending" } }),
  ]);

  const recentOrders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { items: { select: { qty: true } } },
  });

  const stats = [
    { label: "Produits", value: products, href: "/admin/produits" },
    { label: "Marques", value: brands, href: "/admin/marques" },
    { label: "Commandes", value: orders, href: "/admin/commandes" },
    { label: "Commandes en attente", value: pendingOrders, href: "/admin/commandes" },
    { label: "Utilisateurs", value: users, href: "/admin/utilisateurs" },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Tableau de bord</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--space-md)", marginBottom: "var(--space-3xl)" }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)", transition: "border-color 0.15s" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ marginBottom: "var(--space-lg)" }}>Dernières commandes</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Statut</th>
            <th>Total TTC</th>
            <th>Articles</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.map((o) => (
            <tr key={o.id}>
              <td><Link href={`/admin/commandes/${o.id}`} style={{ color: "var(--accent)", fontFamily: "monospace", fontSize: "var(--text-xs)" }}>{o.id.slice(0, 12)}…</Link></td>
              <td><span className={`badge ${o.status === "pending" ? "badge-no-stock" : "badge-stock"}`}>{o.status}</span></td>
              <td>{o.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
              <td>{o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{o.createdAt.toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
