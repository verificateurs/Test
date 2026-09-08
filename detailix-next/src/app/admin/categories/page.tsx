import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteCategoryAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Catégories", robots: { index: false } };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: { _count: { select: { products: true, brands: true } } },
  });

  return (
    <div>
      <h1>Catégories ({categories.length})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/categories/nouveau" className="btn-primary">
        + Nouvelle catégorie
      </Link>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Nom</th>
            <th>Marques</th>
            <th>Produits</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td>{c.position}</td>
              <td>{c.label}</td>
              <td>{c._count.brands}</td>
              <td>{c._count.products}</td>
              <td className="admin-actions-row">
                <Link href={`/admin/categories/${c.id}`}>Modifier</Link>
                <ConfirmDeleteForm action={deleteCategoryAction} hiddenFields={{ id: c.id }} confirmMessage={`Supprimer "${c.label}" ?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
