import { prisma } from "@/lib/prisma";

/**
 * Accès catalogue + logique métier partagée (prix, compatibilité, livraison,
 * homologation). Portage typé des helpers du prototype vanilla.
 *
 * Règle inchangée : aucun prix de vente n'est stocké. Il est toujours calculé
 * à partir du coût (prixAchat) et de la marge globale (Setting.marginPercent).
 */

export type Compatibilite = "universel" | { type: "codesMoteurs"; codes: string[] };

let marginCache: { value: number; at: number } | null = null;
const MARGIN_TTL_MS = 60_000;

export async function getMarginPercent(): Promise<number> {
  if (marginCache && Date.now() - marginCache.at < MARGIN_TTL_MS) return marginCache.value;
  const setting = await prisma.setting.findUnique({ where: { key: "marginPercent" } });
  const value = setting ? Number(setting.value) : 0;
  marginCache = { value: Number.isFinite(value) ? value : 0, at: Date.now() };
  return marginCache.value;
}

/** À appeler depuis l'action admin qui modifie la marge — sans ça, un
 * changement de marge resterait invisible jusqu'à 60s même après la
 * revalidation des pages statiques (le prix vient de ce cache, pas de la
 * requête Prisma directe). */
export function invalidateMarginCache(): void {
  marginCache = null;
}

export function computeSellPrice(prixAchat: number, marginPercent: number): number {
  return Math.round(prixAchat * (1 + marginPercent / 100) * 100) / 100;
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function deliveryEstimate(stock: boolean): { label: string; className: string } {
  return stock === false
    ? { label: "Sur commande, 5-7 jours", className: "delivery-slow" }
    : { label: "Expédié sous 24h", className: "delivery-fast" };
}

export function parseCompatibilite(raw: string): Compatibilite {
  if (raw === "universel") return "universel";
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.type === "codesMoteurs" && Array.isArray(parsed.codes)) return parsed;
  } catch {
    /* donnée mal formée : traitée comme non renseignée ci-dessous */
  }
  return { type: "codesMoteurs", codes: [] };
}

export type CompatStatus = "universel" | "compatible" | "incompatible" | "a-verifier";

export function compatibilityStatus(compatibilite: Compatibilite, activeCodeMoteur: string | null): CompatStatus {
  if (compatibilite === "universel") return "universel";
  if (!Array.isArray(compatibilite.codes) || compatibilite.codes.length === 0) return "a-verifier";
  if (!activeCodeMoteur) return "a-verifier";
  return compatibilite.codes.includes(activeCodeMoteur) ? "compatible" : "incompatible";
}

export const COMPAT_LABELS: Record<CompatStatus, { label: string; className: string }> = {
  universel: { label: "Universel", className: "compat-universel" },
  compatible: { label: "Compatible avec votre véhicule", className: "compat-compatible" },
  incompatible: { label: "Non compatible", className: "compat-incompatible" },
  "a-verifier": { label: "Compatibilité à vérifier", className: "compat-a-verifier" },
};

export const HOMOLOGATION_LABELS: Record<string, { label: string; className: string }> = {
  "route-ouverte": { label: "Homologué route ouverte", className: "homolog-route" },
  "usage-piste": { label: "Usage circuit uniquement — non homologué route", className: "homolog-piste" },
};

export function starString(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

/* ---------- Requêtes ---------- */

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { position: "asc" } });
}

export async function getCategoryWithBrands(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      brands: { include: { reviews: true, products: true } },
      products: { include: { brand: true } },
    },
  });
}

export async function getBrand(id: string) {
  return prisma.brand.findUnique({
    where: { id },
    include: { category: true, reviews: true, products: true },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { brand: true, category: true },
  });
}

export async function getAllProducts() {
  return prisma.product.findMany({ include: { brand: true, category: true } });
}

export async function getVehicleModels() {
  return prisma.vehicleModel.findMany({ include: { make: true, motorisations: true } });
}

/** Produits liés à un modèle : ceux dont un code moteur du modèle est compatible. */
export async function getProductsForModel(modelCodesMoteur: string[]) {
  const products = await getAllProducts();
  return products.filter((p) => {
    const compat = parseCompatibilite(p.compatibilite);
    if (compat === "universel") return false; // les universels ne définissent pas une page véhicule
    return compat.codes.some((code) => modelCodesMoteur.includes(code));
  });
}
