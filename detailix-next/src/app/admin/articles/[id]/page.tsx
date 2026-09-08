import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "../ArticleForm";
import { updateArticleAction } from "../actions";

export const metadata: Metadata = { title: "Modifier un article", robots: { index: false } };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div>
      <h1>Modifier « {article.title} »</h1>
      <div className="admin-card">
        <ArticleForm action={updateArticleAction} article={article} />
      </div>
    </div>
  );
}
