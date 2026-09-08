"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateCatalogue } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slug";
import { BrandFormSchema } from "./schemas";

export type BrandActionState = { error: string | null };

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    origine: String(formData.get("origine") ?? ""),
    gamme: String(formData.get("gamme") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    reviewCount: String(formData.get("reviewCount") ?? ""),
    recommended: formData.get("recommended") === "on",
    preference: String(formData.get("preference") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
  };
}

export async function createBrandAction(_prev: BrandActionState, formData: FormData): Promise<BrandActionState> {
  await requireAdmin();
  const parsed = BrandFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { error: "Catégorie introuvable." };

  const id = slugify(parsed.data.name);
  if (!id) return { error: "Nom invalide pour générer un identifiant." };
  const existing = await prisma.brand.findUnique({ where: { id } });
  if (existing) return { error: `Une marque avec l'identifiant "${id}" existe déjà.` };

  await prisma.brand.create({ data: { id, ...parsed.data } });
  revalidateCatalogue();
  redirect("/admin/marques");
}

export async function updateBrandAction(_prev: BrandActionState, formData: FormData): Promise<BrandActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Marque invalide." };

  const parsed = BrandFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return { error: "Catégorie introuvable." };

  await prisma.brand.update({ where: { id }, data: parsed.data });
  revalidateCatalogue();
  redirect("/admin/marques");
}

export async function deleteBrandAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/marques?erreur=Marque+invalide");

  try {
    await prisma.brand.delete({ where: { id } });
  } catch {
    redirect("/admin/marques?erreur=Suppression+impossible+%E2%80%94+des+produits+utilisent+encore+cette+marque");
  }

  revalidateCatalogue();
  redirect("/admin/marques");
}
