import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { deleteCategoryAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Catégories", robots: { index: false } };

export default async function AdminCategoriesPage({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string; q?: string }> }) {
  const { erreur, page: rawPage, q: rawQ } = await searchParams;
  const page = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { label: { contains: q } } : {};
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      orderBy: { position: "asc" },
      include: { _count: { select: { products: true, brands: true } } },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.category.count({ where }),
  ]);

  return (
    <div>
      <h1>Catégories ({total})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/categories/nouveau" className="btn-primary">
        + Nouvelle catégorie
      </Link>
      <AdminSearchForm q={q} placeholder="Rechercher une catégorie…" />

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
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/categories" query={q ? { q } : {}} />
    </div>
  );
}
