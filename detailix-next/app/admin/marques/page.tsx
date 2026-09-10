import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marques" };

export default async function AdminBrands() {
  await requireAdmin();

  const brands = await db.brand.findMany({
    include: { category: { select: { label: true } }, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Marques ({brands.length})</h1>

      <div className="admin-table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Origine</th>
            <th>Gamme</th>
            <th>Note</th>
            <th>Produits</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.id}>
              <td style={{ fontWeight: 500 }}>
                <Link href={`/marques/${b.id}`} target="_blank" style={{ color: "var(--text)" }}>{b.name}</Link>
              </td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{b.category.label}</td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{b.origine}</td>
              <td style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{b.gamme}</td>
              <td>
                <span style={{ color: "var(--star)", fontWeight: 600 }}>★ {b.rating}</span>
              </td>
              <td>
                <span className="badge badge-compat">{b._count.products}</span>
              </td>
              <td>
                <Link href={`/marques/${b.id}`} className="btn btn-ghost btn-sm" target="_blank">Voir</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
