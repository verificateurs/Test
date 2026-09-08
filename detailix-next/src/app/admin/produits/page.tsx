import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getMarginPercent, computeSellPrice, formatPrice } from "@/lib/catalogue";
import { deleteProductAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Produits", robots: { index: false } };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const [products, marginPercent] = await Promise.all([
    prisma.product.findMany({ include: { brand: true, category: true }, orderBy: { name: "asc" } }),
    getMarginPercent(),
  ]);

  return (
    <div>
      <h1>Produits ({products.length})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/produits/nouveau" className="btn-primary">
        + Nouveau produit
      </Link>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Marque</th>
            <th>Catégorie</th>
            <th>Prix achat</th>
            <th>Prix vente</th>
            <th>Stock</th>
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
              <td>{p.stock ? "Oui" : "Non"}</td>
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
    </div>
  );
}
