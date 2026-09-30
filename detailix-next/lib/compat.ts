import type { JsonValue } from "@prisma/client/runtime/library";

type CompatData =
  | { type: "universel" }
  | { type: "codesMoteurs"; codes: string[] }
  | { type: "plateformes"; codes: string[] };

export interface ParsedCompat {
  /** "universel" (tous véhicules), ou un couple (mode, codes). */
  mode: "universel" | "codesMoteurs" | "plateformes";
  codes: string[];
}

/**
 * @deprecated utiliser parseCompat() — conservé pour la compat ascendante des
 * appelants qui ne distinguent pas encore moteur/plateforme (traite les deux
 * modes comme une simple liste de codes à comparer côté appelant).
 */
export function parseCompatCodes(raw: JsonValue): string[] | "universel" | undefined {
  const parsed = parseCompat(raw);
  if (!parsed) return undefined;
  return parsed.mode === "universel" ? "universel" : parsed.codes;
}

export function parseCompat(raw: JsonValue): ParsedCompat | undefined {
  if (!raw) return undefined;
  try {
    const c = (typeof raw === "string" ? JSON.parse(raw) : raw) as CompatData;
    if (c.type === "universel") return { mode: "universel", codes: [] };
    if ((c.type === "codesMoteurs" || c.type === "plateformes") && Array.isArray(c.codes)) {
      return { mode: c.type, codes: c.codes };
    }
  } catch {}
  return undefined;
}

/** Un véhicule est compatible si son codeMoteur OU sa plateforme matche selon le mode du produit. */
export function isCompatible(
  compat: ParsedCompat | undefined,
  vehicle: { codeMoteur: string; platform?: string | null }
): boolean {
  if (!compat) return false;
  if (compat.mode === "universel") return true;
  if (compat.mode === "codesMoteurs") return compat.codes.includes(vehicle.codeMoteur);
  if (compat.mode === "plateformes") return !!vehicle.platform && compat.codes.includes(vehicle.platform);
  return false;
}
