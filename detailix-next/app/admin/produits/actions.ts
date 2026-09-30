"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

const productSchema = z.object({
  id: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  brandId: z.string().min(1).max(100),
  categoryId: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  format: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  prixAchat: z.coerce.number().positive().max(100000),
  stockQty: z.coerce.number().int().min(0).max(9999),
  compatibilite: z.string().min(1),
  homologation: z.enum(["route_ouverte", "usage_piste", "non_applicable"]).optional(),
});

// Matches the shape lib/compat.ts::parseCompat expects — anything else
// (e.g. a bare "universel" string, or an object missing/mis-typed `codes`)
// must be rejected here rather than silently stored.
const compatSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("universel") }).strict(),
  z.object({ type: z.literal("codesMoteurs"), codes: z.array(z.string().min(1)).min(1) }).strict(),
  z.object({ type: z.literal("plateformes"), codes: z.array(z.string().min(1)).min(1) }).strict(),
]);

const COMPAT_ERROR = 'Format compatibilité invalide : attendu {"type":"universel"}, {"type":"codesMoteurs","codes":["..."]} ou {"type":"plateformes","codes":["..."]}.';

type State = { error?: string; success?: string } | null;

export async function createProductAction(_prev: State, fd: FormData): Promise<State> {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const { compatibilite, ...rest } = parsed.data;
  let compatRaw: unknown;
  try { compatRaw = JSON.parse(compatibilite); } catch { return { error: "Format compatibilité invalide (JSON)." }; }
  const compatParsed = compatSchema.safeParse(compatRaw);
  if (!compatParsed.success) return { error: COMPAT_ERROR };

  try {
    await db.product.create({ data: { ...rest, compatibilite: JSON.stringify(compatParsed.data) } });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") return { error: "Un produit avec cet ID existe déjà." };
    throw e;
  }

  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function updateProductAction(_prev: State, fd: FormData): Promise<State> {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides." };

  const { id, compatibilite, ...rest } = parsed.data;
  let compatRaw: unknown;
  try { compatRaw = JSON.parse(compatibilite); } catch { return { error: "Format compatibilité invalide (JSON)." }; }
  const compatParsed = compatSchema.safeParse(compatRaw);
  if (!compatParsed.success) return { error: COMPAT_ERROR };

  await db.product.update({ where: { id }, data: { ...rest, compatibilite: JSON.stringify(compatParsed.data) } });
  revalidatePath("/admin/produits");
  revalidatePath(`/produits/${id}`);
  return { success: "Produit mis à jour." };
}

export async function deleteProductAction(fd: FormData): Promise<void> {
  await requireAdmin();

  const id = fd.get("id");
  if (typeof id !== "string" || !id) return;

  try {
    await db.product.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2003") {
      redirect(`/admin/produits?error=${encodeURIComponent("Produit déjà commandé ou en favoris — impossible de le supprimer.")}`);
    }
    throw e;
  }

  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}
