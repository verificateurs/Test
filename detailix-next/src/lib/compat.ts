/**
 * Logique de compatibilité véhicule — pure, sans dépendance serveur (pas
 * d'import Prisma), pour être importable aussi bien côté serveur (fiches
 * produit statiques, badge par défaut) que côté client (CompatBadge,
 * recalcul en fonction du véhicule actif du garage, lui-même en
 * localStorage). Réexporté par lib/catalogue.ts pour les usages serveur
 * existants.
 */

export type Compatibilite = "universel" | { type: "codesMoteurs"; codes: string[] };

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
