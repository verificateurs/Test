import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, clampPage, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { deleteBrandAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Marques", robots: { index: false } };

export default async function AdminBrandsPage({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string; q?: string }> }) {
  const { erreur, page: rawPage, q: rawQ } = await searchParams;
  const requestedPage = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { name: { contains: q } } : {};
  const total = await prisma.brand.count({ where });
  const page = clampPage(requestedPage, total, ADMIN_PAGE_SIZE);
  const brands = await prisma.brand.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });

  return (
    <div>
      <h1>Marques ({total})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/marques/nouveau" className="btn-primary">
        + Nouvelle marque
      </Link>
      <AdminSearchForm q={q} placeholder="Rechercher une marque…" />

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
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/marques" query={q ? { q } : {}} />
    </div>
  );
}
