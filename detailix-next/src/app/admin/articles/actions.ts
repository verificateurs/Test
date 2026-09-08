"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateBlog } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slug";
import { ArticleFormSchema } from "./schemas";

export type ArticleActionState = { error: string | null };

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    content: String(formData.get("content") ?? ""),
  };
}

export async function createArticleAction(_prev: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  await requireAdmin();
  const parsed = ArticleFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const slug = slugify(parsed.data.title);
  if (!slug) return { error: "Titre invalide pour générer une URL." };
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) return { error: `Un article avec l'URL "${slug}" existe déjà.` };

  await prisma.article.create({ data: { slug, ...parsed.data } });
  revalidateBlog();
  redirect("/admin/articles");
}

export async function updateArticleAction(_prev: ArticleActionState, formData: FormData): Promise<ArticleActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Article invalide." };

  const parsed = ArticleFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  await prisma.article.update({ where: { id }, data: parsed.data });
  revalidateBlog();
  redirect("/admin/articles");
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/articles?erreur=Article+invalide");

  await prisma.article.delete({ where: { id } });
  revalidateBlog();
  redirect("/admin/articles");
}
