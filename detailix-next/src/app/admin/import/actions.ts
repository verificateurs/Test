"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/rbac";
import { revalidateCatalogue } from "@/lib/admin/revalidate";
import { FALLBACK_IN_STOCK_QTY } from "@/lib/catalogue";
import { ImportPayloadSchema, type ProductImport } from "./schemas";

export type ImportActionState = { error: string | null; success: string | null };

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 Mo — un catalogue de quelques milliers de produits tient largement dedans

function compatibiliteToJson(c: ProductImport["compatibilite"]): string {
  return c === "universel" ? "universel" : JSON.stringify(c);
}

export async function importProductsAction(_prev: ImportActionState, formData: FormData): Promise<ImportActionState> {
  await requireAdmin();

  const file = formData.get("file");
  const mode = String(formData.get("mode") ?? "create");
  if (!(file instanceof File)) return { error: "Aucun fichier fourni.", success: null };
  if (file.size === 0) return { error: "Fichier vide.", success: null };
  if (file.size > MAX_UPLOAD_BYTES) return { error: `Fichier trop volumineux (max ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo).`, success: null };
  if (mode !== "create" && mode !== "update") return { error: "Mode d'import invalide.", success: null };

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return { error: "JSON illisible.", success: null };
  }

  const parsed = ImportPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: `Format invalide : ${first?.path.join(".")} — ${first?.message}`, success: null };
  }

  const products = parsed.data.products;

  // Unicité interne au fichier (une même clé primaire deux fois dans le même
  // import romprait silencieusement l'un des deux enregistrements).
  const seenIds = new Set<string>();
  for (const p of products) {
    if (seenIds.has(p.id)) return { error: `Identifiant "${p.id}" dupliqué dans le fichier importé.`, success: null };
    seenIds.add(p.id);
  }

  // Intégrité référentielle : la marque doit exister et sa catégorie doit
  // correspondre à celle déclarée sur le produit (porté de
  // tools/validate-catalogue.js du site vanilla).
  const brandIds = [...new Set(products.map((p) => p.brandId))];
  const brands = await prisma.brand.findMany({ where: { id: { in: brandIds } }, select: { id: true, categoryId: true } });
  const brandById = new Map(brands.map((b) => [b.id, b]));
  for (const p of products) {
    const brand = brandById.get(p.brandId);
    if (!brand) return { error: `Produit "${p.id}" : marque "${p.brandId}" introuvable.`, success: null };
    if (brand.categoryId !== p.categoryId) {
      return { error: `Produit "${p.id}" : categoryId "${p.categoryId}" ne correspond pas à la catégorie réelle de la marque ("${brand.categoryId}").`, success: null };
    }
  }

  if (mode === "create") {
    const existing = await prisma.product.findMany({ where: { id: { in: [...seenIds] } }, select: { id: true } });
    if (existing.length > 0) {
      return {
        error: `${existing.length} identifiant(s) déjà existants (mode création) : ${existing.map((e) => e.id).slice(0, 10).join(", ")}${existing.length > 10 ? "…" : ""}. Utilisez le mode mise à jour pour les écraser volontairement.`,
        success: null,
      };
    }
  }

  // Le format d'import ne connaît que le booléen hérité "stock" (compatible
  // avec data/products.json du site vanilla), jamais une quantité réelle. À
  // la création, on lui donne une quantité de départ raisonnable. À la mise
  // à jour, l'asymétrie est volontaire : "stock: false" est un signal sans
  // ambiguïté (rupture) et force stockQty à 0, alors que "stock: true" ne
  // dit rien sur la quantité réelle — on laisse alors intact un stock déjà
  // affiné via le formulaire produit (ProductForm, qui expose stockQty
  // directement), pour ne pas le remettre à une valeur générique à chaque
  // réimport d'un export précédent.
  await prisma.$transaction(
    products.map((p) =>
      prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          name: p.name,
          format: p.format,
          description: p.description,
          prixAchat: p.prixAchat,
          stockQty: p.stock ? FALLBACK_IN_STOCK_QTY : 0,
          compatibilite: compatibiliteToJson(p.compatibilite),
          homologation: p.homologation ?? null,
          brandId: p.brandId,
          categoryId: p.categoryId,
        },
        update: {
          name: p.name,
          format: p.format,
          description: p.description,
          prixAchat: p.prixAchat,
          ...(p.stock ? {} : { stockQty: 0 }),
          compatibilite: compatibiliteToJson(p.compatibilite),
          homologation: p.homologation ?? null,
          brandId: p.brandId,
          categoryId: p.categoryId,
        },
      })
    )
  );

  revalidateCatalogue();
  return { error: null, success: `${products.length} produit(s) importé(s).` };
}

export async function exportProductsAction(): Promise<string> {
  await requireAdmin();
  const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
  const exported = products.map((p) => ({
    id: p.id,
    name: p.name,
    format: p.format,
    description: p.description,
    prixAchat: p.prixAchat,
    stock: p.stockQty > 0,
    compatibilite: p.compatibilite === "universel" ? "universel" : JSON.parse(p.compatibilite),
    homologation: p.homologation,
    brandId: p.brandId,
    categoryId: p.categoryId,
  }));
  return JSON.stringify({ products: exported }, null, 2);
}
