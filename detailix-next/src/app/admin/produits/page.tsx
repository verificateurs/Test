import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMarginPercent, computeSellPrice, formatPrice } from "@/lib/catalogue";
import { ADMIN_PAGE_SIZE, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { deleteProductAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Produits", robots: { index: false } };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string; q?: string }> }) {
  const { erreur, page: rawPage, q: rawQ } = await searchParams;
  const page = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { name: { contains: q } } : {};
  const [products, total, marginPercent] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { brand: true, category: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    getMarginPercent(),
  ]);

  return (
    <div>
      <h1>Produits ({total})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/produits/nouveau" className="btn-primary">
        + Nouveau produit
      </Link>
      <AdminSearchForm q={q} placeholder="Rechercher un produit…" />

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Marque</th>
            <th>Catégorie</th>
            <th>Prix achat</th>
            <th>Prix vente</th>
            <th>Stock (qté)</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.brand.name}</td>
              <td>{p.category.label}</td>
              <td>{formatPrice(p.prixAchat)}</td>
              <td>{formatPrice(computeSellPrice(p.prixAchat, marginPercent))}</td>
              <td>{p.stockQty}</td>
              <td className="admin-actions-row">
                <Link href={`/admin/produits/${p.id}`}>Modifier</Link>
                <ConfirmDeleteForm
                  action={deleteProductAction}
                  hiddenFields={{ id: p.id }}
                  confirmMessage={`Supprimer "${p.name}" ?`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/produits" query={q ? { q } : {}} />
    </div>
  );
}
