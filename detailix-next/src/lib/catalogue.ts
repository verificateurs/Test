import { prisma } from "@/lib/prisma";
import { parseCompatibilite, compatibilityStatus, COMPAT_LABELS } from "@/lib/compat";
export type { Compatibilite, CompatStatus } from "@/lib/compat";
export { parseCompatibilite, compatibilityStatus, COMPAT_LABELS };

/**
 * Accès catalogue + logique métier partagée (prix, compatibilité, livraison,
 * homologation). Portage typé des helpers du prototype vanilla.
 *
 * La logique de compatibilité vit dans lib/compat.ts (réexportée ici pour ne
 * pas casser les imports existants) : ce fichier-ci importe Prisma et ne
 * peut donc jamais être importé depuis un composant client (CompatBadge,
 * garage) sans faire fuiter le client Prisma dans le bundle navigateur.
 *
 * Règle inchangée : aucun prix de vente n'est stocké. Il est toujours calculé
 * à partir du coût (prixAchat) et de la marge globale (Setting.marginPercent).
 */

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

export function deliveryEstimate(inStock: boolean): { label: string; className: string } {
  return inStock === false
    ? { label: "Sur commande, 5-7 jours", className: "delivery-slow" }
    : { label: "Expédié sous 24h", className: "delivery-fast" };
}

/**
 * Utilisée uniquement à la frontière avec l'ancien indicateur booléen `stock`
 * (format d'import/export JSON back-office, hérité de data/products.json du
 * prototype vanilla — voir admin/import/actions.ts) : cette frontière ne
 * connaît qu'un booléen, jamais une quantité réelle, donc une valeur de
 * démarrage raisonnable est nécessaire pour ne pas tout remettre à zéro à
 * chaque import "en stock". Le formulaire produit individuel (ProductForm),
 * lui, expose directement stockQty.
 */
export const FALLBACK_IN_STOCK_QTY = 25;

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
