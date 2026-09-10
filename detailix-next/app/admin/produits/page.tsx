import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { computePrice } from "@/lib/pricing";
import { deleteProductAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits" };

export default async function AdminProducts() {
  await requireAdmin();

  const products = await db.product.findMany({
    include: { brand: { select: { name: true } }, category: { select: { label: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-xl)" }}>
        <h1>Produits ({products.length})</h1>
        <Link href="/admin/produits/nouveau" className="btn btn-primary btn-sm">+ Ajouter</Link>
      </div>

      <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Marque</th>
            <th>Catégorie</th>
            <th>Prix TTC</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/produits/${p.id}`} target="_blank" style={{ color: "var(--text)", fontWeight: 500 }}>{p.name}</Link>
              </td>
              <td style={{ color: "var(--text-muted)" }}>{p.brand.name}</td>
              <td style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>{p.category.label}</td>
              <td style={{ color: "var(--accent)", fontWeight: 600 }}>
                {computePrice(p.prixAchat).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </td>
              <td>
                <span className={`badge ${p.stockQty > 0 ? "badge-stock" : "badge-no-stock"}`}>{p.stockQty}</span>
              </td>
              <td>
                <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                  <Link href={`/admin/produits/${p.id}`} className="btn btn-ghost btn-sm">Éditer</Link>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}
                      onClick={(e) => { if (!confirm(`Supprimer "${p.name}" ?`)) e.preventDefault(); }}>
                      Supprimer
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
