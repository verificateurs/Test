import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMarginPercent, computeSellPrice, formatPrice } from "@/lib/catalogue";

export const dynamic = "force-static";

/**
 * Index de recherche consommé par SearchBox (île client, autocomplétion) —
 * un composant client ne peut pas interroger Prisma directement. Route
 * force-static comme le reste du catalogue, revalidée par
 * revalidateCatalogue() : sans ça, un produit créé en admin resterait
 * introuvable en recherche alors même que sa fiche publique fonctionne déjà
 * (le cache mémoire de marge a déjà causé exactement ce type de divergence
 * silencieuse — voir invalidateMarginCache()).
 */
export async function GET() {
  const [products, brands] = await Promise.all([
    prisma.product.findMany({ include: { brand: true } }),
    prisma.brand.findMany({ include: { category: true } }),
  ]);
  const marginPercent = await getMarginPercent();

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      brandName: p.brand.name,
      price: formatPrice(computeSellPrice(p.prixAchat, marginPercent)),
    })),
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      origine: b.origine,
      categoryId: b.categoryId,
      categoryLabel: b.category.label,
    })),
  });
}
