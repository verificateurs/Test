"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateCatalogue } from "@/lib/admin/revalidate";
import { slugify } from "@/lib/slug";
import { ProductFormSchema, buildCompatibilite } from "./schemas";

export type ProductActionState = { error: string | null };

function readFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    format: String(formData.get("format") ?? ""),
    description: String(formData.get("description") ?? ""),
    prixAchat: String(formData.get("prixAchat") ?? ""),
    stockQty: String(formData.get("stockQty") ?? ""),
    compatibiliteType: String(formData.get("compatibiliteType") ?? "universel"),
    compatibiliteCodes: String(formData.get("compatibiliteCodes") ?? ""),
    homologation: String(formData.get("homologation") ?? ""),
    brandId: String(formData.get("brandId") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
  };
}

export async function createProductAction(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const parsed = ProductFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const [brand, category] = await Promise.all([
    prisma.brand.findUnique({ where: { id: parsed.data.brandId } }),
    prisma.category.findUnique({ where: { id: parsed.data.categoryId } }),
  ]);
  if (!brand) return { error: "Marque introuvable." };
  if (!category) return { error: "Catégorie introuvable." };

  const id = slugify(parsed.data.name);
  if (!id) return { error: "Nom invalide pour générer un identifiant." };
  const existing = await prisma.product.findUnique({ where: { id } });
  if (existing) return { error: `Un produit avec l'identifiant "${id}" existe déjà (nom trop proche d'un produit existant).` };

  await prisma.product.create({
    data: {
      id,
      name: parsed.data.name,
      format: parsed.data.format,
      description: parsed.data.description,
      prixAchat: parsed.data.prixAchat,
      stockQty: parsed.data.stockQty,
      compatibilite: buildCompatibilite(parsed.data),
      homologation: parsed.data.homologation || null,
      brandId: parsed.data.brandId,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateCatalogue();
  redirect("/admin/produits");
}

export async function updateProductAction(_prev: ProductActionState, formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produit invalide." };

  const parsed = ProductFormSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const [brand, category] = await Promise.all([
    prisma.brand.findUnique({ where: { id: parsed.data.brandId } }),
    prisma.category.findUnique({ where: { id: parsed.data.categoryId } }),
  ]);
  if (!brand) return { error: "Marque introuvable." };
  if (!category) return { error: "Catégorie introuvable." };

  await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      format: parsed.data.format,
      description: parsed.data.description,
      prixAchat: parsed.data.prixAchat,
      stockQty: parsed.data.stockQty,
      compatibilite: buildCompatibilite(parsed.data),
      homologation: parsed.data.homologation || null,
      brandId: parsed.data.brandId,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateCatalogue();
  redirect("/admin/produits");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/produits?erreur=Produit+invalide");

  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    // Contrainte de clé étrangère : des OrderLine référencent ce produit.
    redirect("/admin/produits?erreur=Suppression+impossible+%E2%80%94+ce+produit+figure+dans+des+commandes+existantes");
  }

  revalidateCatalogue();
  redirect("/admin/produits");
}
