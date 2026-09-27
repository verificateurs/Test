import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompatCodes } from "@/lib/compat";

/** Catégories dont les produits sont directement liés à la préparation du moteur. */
const ENGINE_CATEGORY_IDS = ["preparation-moteur", "echappement-sport", "entretien-moteur"];

export interface EngineCompatibleProduct {
  id: string;
  name: string;
  brandName: string;
  categoryId: string;
  format: string;
  price: number;
  stockQty: number;
}

/**
 * Produits des catégories liées au moteur (préparation moteur, échappement sport)
 * compatibles avec un codeMoteur donné — soit explicitement listés, soit "universel".
 * Ne renvoie jamais prixAchat : uniquement le prix de vente calculé via computePrice().
 */
export async function getEngineCompatibleProducts(codeMoteur: string): Promise<EngineCompatibleProduct[]> {
  const products = await db.product.findMany({
    where: { categoryId: { in: ENGINE_CATEGORY_IDS } },
    include: { brand: true },
  });

  return products
    .filter((p) => {
      const compat = parseCompatCodes(p.compatibilite);
      if (compat === "universel") return true;
      if (Array.isArray(compat)) return compat.includes(codeMoteur);
      return false;
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      brandName: p.brand.name,
      categoryId: p.categoryId,
      format: p.format,
      price: computePrice(p.prixAchat),
      stockQty: p.stockQty,
    }));
}
