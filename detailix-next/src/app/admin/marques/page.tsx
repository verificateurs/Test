import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteBrandAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Marques", robots: { index: false } };

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const brands = await prisma.brand.findMany({ include: { category: true }, orderBy: { name: "asc" } });

  return (
    <div>
      <h1>Marques ({brands.length})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/marques/nouveau" className="btn-primary">
        + Nouvelle marque
      </Link>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Note</th>
            <th>Recommandée</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {brands.map((b) => (
            <tr key={b.id}>
              <td>{b.name}</td>
              <td>{b.category.label}</td>
              <td>{b.rating.toFixed(1)} ({b.reviewCount})</td>
              <td>{b.recommended ? "Oui" : "Non"}</td>
              <td className="admin-actions-row">
                <Link href={`/admin/marques/${b.id}`}>Modifier</Link>
                <ConfirmDeleteForm action={deleteBrandAction} hiddenFields={{ id: b.id }} confirmMessage={`Supprimer "${b.name}" ?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
