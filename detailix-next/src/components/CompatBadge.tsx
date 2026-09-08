"use client";

import { useGarage } from "@/lib/garage/GarageContext";
import { parseCompatibilite, compatibilityStatus, COMPAT_LABELS } from "@/lib/compat";

/**
 * Badge de compatibilité recalculé côté client selon le véhicule actif du
 * garage (localStorage). Avant hydratation, se comporte EXACTEMENT comme le
 * rendu serveur par défaut (aucun véhicule connu -> "universel"/"à
 * vérifier") pour ne jamais produire de mismatch d'hydratation React — le
 * badge se met ensuite à jour, sans flash, une fois le garage relu.
 */
export function CompatBadge({ compatibilite }: { compatibilite: string }) {
  const { activeVehicle, hydrated } = useGarage();
  const activeCodeMoteur = hydrated ? (activeVehicle?.codeMoteur ?? null) : null;
  const status = compatibilityStatus(parseCompatibilite(compatibilite), activeCodeMoteur);
  const compat = COMPAT_LABELS[status];
  return <span className={`compat-badge ${compat.className}`}>{compat.label}</span>;
}
