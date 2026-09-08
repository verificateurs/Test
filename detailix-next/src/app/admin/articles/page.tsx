import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteArticleAction } from "./actions";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";

export const metadata: Metadata = { title: "Articles", robots: { index: false } };

export default async function AdminArticlesPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  const articles = await prisma.article.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <div>
      <h1>Articles ({articles.length})</h1>
      {erreur && <p className="admin-flash error">{erreur}</p>}
      <Link href="/admin/articles/nouveau" className="btn-primary">
        + Nouvel article
      </Link>

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
    </div>
  );
}
