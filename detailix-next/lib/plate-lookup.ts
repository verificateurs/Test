/**
 * Simulateur de recherche par plaque d'immatriculation française (format SIV).
 *
 * Ceci n'est PAS un accès au fichier SIV officiel : il n'existe pas d'API
 * gouvernementale gratuite pour ça (une vraie recherche nécessiterait un
 * prestataire payant tiers). Il s'agit d'une résolution déterministe locale :
 * TOUTE plaque valide (format SIV, séparateurs optionnels) résout vers un
 * véhicule du catalogue via un hash — la même plaque donne toujours le même
 * véhicule, mais l'association plaque <-> véhicule est arbitraire, pas réelle.
 * Affiché comme tel dans l'UI (GarageSelector : "Démo — plaque fictive").
 */

// Accepte avec/sans tirets ou espaces, insensible à la casse : "AA-123-AA",
// "AA123AA", "aa 123 aa" sont tous valides — seule la normalisation diffère.
const PLATE_FORMAT = /^[A-Z]{2}[-\s]?\d{3}[-\s]?[A-Z]{2}$/i;

export function isValidPlateFormat(plaque: string): boolean {
  return PLATE_FORMAT.test(plaque.trim());
}

/** Forme canonique sans séparateurs, en majuscules : "aa-123-aa" -> "AA123AA". */
export function normalizePlate(plaque: string): string {
  return plaque.trim().toUpperCase().replace(/[-\s]/g, "");
}

/** Forme d'affichage avec tirets : "AA123AA" -> "AA-123-AA". */
export function formatPlate(plaque: string): string {
  const n = normalizePlate(plaque);
  if (n.length !== 7) return plaque;
  return `${n.slice(0, 2)}-${n.slice(2, 5)}-${n.slice(5, 7)}`;
}

/** Hash FNV-1a 32 bits — rapide, déterministe, distribution suffisante pour cet usage. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Choisit un index déterministe dans [0, count) pour une plaque valide donnée.
 * `count` est le nombre de véhicules actuellement en base (appelant = route API,
 * qui fait le SELECT et applique cet index). Retourne null si le format est invalide
 * ou si le catalogue est vide.
 */
export function plateToVehicleIndex(plaque: string, count: number): number | null {
  if (!isValidPlateFormat(plaque) || count <= 0) return null;
  return fnv1a(normalizePlate(plaque)) % count;
}
