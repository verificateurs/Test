"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateCatalogue } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slug";

export type CategoryActionState = { error: string | null };

const CategorySchema = z.object({
  label: z.string().trim().min(1, "Nom requis").max(120),
  description: z.string().trim().min(1, "Description requise").max(500),
  position: z.coerce.number().int().min(0),
});

export async function createCategoryAction(_prev: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  await requireAdmin();
  const parsed = CategorySchema.safeParse({
    label: formData.get("label"),
    description: formData.get("description"),
    position: formData.get("position"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const id = slugify(parsed.data.label);
  if (!id) return { error: "Nom invalide pour générer un identifiant." };
  const existing = await prisma.category.findUnique({ where: { id } });
  if (existing) return { error: `Une catégorie avec l'identifiant "${id}" existe déjà.` };

  await prisma.category.create({ data: { id, ...parsed.data } });
  revalidateCatalogue();
  redirect("/admin/categories");
}

export async function updateCategoryAction(_prev: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Catégorie invalide." };

  const parsed = CategorySchema.safeParse({
    label: formData.get("label"),
    description: formData.get("description"),
    position: formData.get("position"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  await prisma.category.update({ where: { id }, data: parsed.data });
  revalidateCatalogue();
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/categories?erreur=Cat%C3%A9gorie+invalide");

  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    redirect("/admin/categories?erreur=Suppression+impossible+%E2%80%94+des+marques+ou+produits+y+sont+encore+rattach%C3%A9s");
  }

  revalidateCatalogue();
  redirect("/admin/categories");
}
