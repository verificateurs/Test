import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ADMIN_PAGE_SIZE, clampPage, parsePage, parseSearchQuery } from "@/lib/admin/pagination";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { deleteArticleAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Articles", robots: { index: false } };

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<{ erreur?: string; page?: string; q?: string }> }) {
  const { erreur, page: rawPage, q: rawQ } = await searchParams;
  const requestedPage = parsePage(rawPage);
  const q = parseSearchQuery(rawQ);
  const where = q ? { title: { contains: q } } : {};
  const total = await prisma.article.count({ where });
  const page = clampPage(requestedPage, total, ADMIN_PAGE_SIZE);
  const articles = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * ADMIN_PAGE_SIZE,
    take: ADMIN_PAGE_SIZE,
  });

  return (
    <div>
      <h1>Articles ({total})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/articles/nouveau" className="btn-primary">
        + Nouvel article
      </Link>
      <AdminSearchForm q={q} placeholder="Rechercher un article…" />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>URL</th>
            <th>Publié le</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {articles.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>/blog/{a.slug}</td>
              <td>{a.publishedAt.toLocaleDateString("fr-FR")}</td>
              <td className="admin-actions-row">
                <Link href={`/admin/articles/${a.id}`}>Modifier</Link>
                <ConfirmDeleteForm action={deleteArticleAction} hiddenFields={{ id: a.id }} confirmMessage={`Supprimer "${a.title}" ?`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <AdminPagination page={page} total={total} pageSize={ADMIN_PAGE_SIZE} basePath="/admin/articles" query={q ? { q } : {}} />
    </div>
  );
}
