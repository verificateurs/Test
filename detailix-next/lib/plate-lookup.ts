/**
 * Simulateur de recherche par plaque d'immatriculation française.
 *
 * Ceci n'est PAS un accès au fichier SIV officiel : il n'existe pas d'API
 * gouvernementale gratuite pour ça (une vraie recherche nécessiterait un
 * prestataire payant tiers). Il s'agit d'une résolution déterministe locale :
 * TOUTE plaque valide (format SIV actuel ou format FNI antérieur à 2009,
 * séparateurs optionnels) résout vers un véhicule du catalogue via un hash —
 * la même plaque donne toujours le même véhicule, mais l'association plaque
 * <-> véhicule est arbitraire, pas réelle. Affiché comme tel dans l'UI
 * (GarageSelector : "Démo — plaque fictive").
 */

// Alphabet SIV : les lettres I, O et U sont interdites depuis 1984 (I et O
// pour confusion avec 1 et 0 ; U, supprimé en novembre 1984, pour confusion
// avec V sur les procès-verbaux). Source : Wikipédia, "Plaque
// d'immatriculation française", section "Exclusion de combinaisons". La
// formule officielle du nombre de combinaisons SIV,
// [(23×23)-2]×999×[(23×23)-1], n'est cohérente qu'avec un alphabet de 23
// lettres (26 - I, O, U), ce qui confirme la règle côté SIV (entré en
// vigueur après 1984, donc jamais concerné par le U).
const SIV_LETTER = "[A-HJ-NP-TV-Z]";

// Alphabet FNI : I et O n'ont jamais été utilisés, mais le U n'a été retiré
// qu'en novembre 1984 — des plaques FNI valides le portent encore (même
// source : "le dernier U attribué [...] a été le 9999 TU 45 [...] en avril
// 1991"), donc on ne l'exclut pas ici.
const FNI_LETTER = "[A-HJ-NP-Z]";

// Format SIV (en vigueur depuis le 15 avril 2009) : 2 lettres, 3 chiffres,
// 2 lettres. Séparateurs (tiret ou espace) optionnels, casse indifférente.
const SIV_FORMAT = new RegExp(`^${SIV_LETTER}{2}[-\\s]?\\d{3}[-\\s]?${SIV_LETTER}{2}$`, "i");

// Ancien format FNI (avant le SIV) : 1 à 4 chiffres (numéro d'ordre), 2
// lettres (série), 2 chiffres (département) — ex. "1234 AB 56".
const FNI_FORMAT = new RegExp(`^\\d{1,4}[-\\s]?${FNI_LETTER}{2}[-\\s]?\\d{2}$`, "i");

/**
 * Le calcul officiel du nombre de combinaisons SIV (même source Wikipédia)
 * exclut les séries SS et WW du bloc de lettres de gauche — soit -2 sur
 * (23×23) — et la seule série SS du bloc de droite — soit -1. WW reste donc
 * autorisé dans le bloc de droite d'après ce calcul.
 */
function hasForbiddenSivLetterPairs(normalized: string): boolean {
  const left = normalized.slice(0, 2);
  const right = normalized.slice(5, 7);
  return left === "SS" || left === "WW" || right === "SS";
}

/**
 * Sous le régime FNI, certaines séries de lettres étaient systématiquement
 * omises dans tous les départements : TT et WW (même source Wikipédia,
 * section "Exclusion de combinaisons"). SS y a aussi été exclue, mais
 * seulement "depuis quelques années" avant l'arrêt du FNI — auparavant elle
 * restait au choix de chaque département —, donc on ne l'exclut pas ici
 * pour ne pas rejeter des plaques historiquement valides.
 */
function hasForbiddenFniLetterPair(letters: string): boolean {
  return letters === "TT" || letters === "WW";
}

export type PlateFormat = "siv" | "fni";

/** Détecte le format d'une plaque (SIV ou FNI) et vérifie ses règles propres. Retourne null si invalide. */
export function detectPlateFormat(plaque: string): PlateFormat | null {
  const trimmed = plaque.trim();
  if (SIV_FORMAT.test(trimmed)) {
    const normalized = trimmed.toUpperCase().replace(/[-\s]/g, "");
    return hasForbiddenSivLetterPairs(normalized) ? null : "siv";
  }
  if (FNI_FORMAT.test(trimmed)) {
    const normalized = trimmed.toUpperCase().replace(/[-\s]/g, "");
    const letters = normalized.slice(-4, -2);
    return hasForbiddenFniLetterPair(letters) ? null : "fni";
  }
  return null;
}

export function isValidPlateFormat(plaque: string): boolean {
  return detectPlateFormat(plaque) !== null;
}

/**
 * Forme canonique sans séparateurs, en majuscules : "aa-123-aa" -> "AA123AA",
 * "1234 ab 56" -> "1234AB56". Les deux formats ne peuvent pas se confondre :
 * une plaque SIV commence toujours par une lettre, une plaque FNI toujours
 * par un chiffre.
 */
export function normalizePlate(plaque: string): string {
  return plaque.trim().toUpperCase().replace(/[-\s]/g, "");
}

/** Forme d'affichage avec séparateurs, adaptée au format détecté. */
export function formatPlate(plaque: string): string {
  const format = detectPlateFormat(plaque);
  const n = normalizePlate(plaque);
  if (format === "siv" && n.length === 7) {
    return `${n.slice(0, 2)}-${n.slice(2, 5)}-${n.slice(5, 7)}`;
  }
  if (format === "fni") {
    const dept = n.slice(-2);
    const letters = n.slice(-4, -2);
    const digits = n.slice(0, -4);
    return `${digits}-${letters}-${dept}`;
  }
  return plaque;
}

/** Hash FNV-1a 32 bits — rapide, déterministe. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Finaliseur d'avalanche (Murmur3 fmix32). FNV-1a seul mélange mal ses bits
 * de poids fort : sur un hachage rendezvous (on ne garde que le score max
 * parmi N candidats très proches en texte, `plaque#id1`, `plaque#id2`...),
 * ça biaise fortement la répartition entre véhicules (vérifié empiriquement :
 * jusqu'à ×4,7 la moyenne sur 269 véhicules). Ce finaliseur ramène l'écart à
 * ±10 % sur la même mesure.
 */
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function rendezvousScore(key: string, id: string): number {
  return fmix32(fnv1a(`${key}#${id}`));
}

/**
 * Choisit un véhicule déterministe pour une plaque valide, par hachage
 * "rendezvous" (highest random weight) : pour chaque véhicule candidat, on
 * calcule hash(plaque + id) et on retient celui dont le score est maximal.
 *
 * Contrairement à un `hash(plaque) % count`, ce schéma est stable quand le
 * catalogue change : ajouter ou retirer un véhicule ne change l'association
 * d'une plaque donnée que si le véhicule retiré était justement celui choisi
 * — tous les autres gardent la même résolution.
 *
 * `vehicleIds` est fourni par l'appelant (route API, qui fait le SELECT) ;
 * ce module reste pur et ne dépend pas de la base de données.
 */
export function plateToVehicleId(plaque: string, vehicleIds: string[]): string | null {
  if (!isValidPlateFormat(plaque) || vehicleIds.length === 0) return null;
  const key = normalizePlate(plaque);

  let bestId: string | null = null;
  let bestScore = -1;
  for (const id of vehicleIds) {
    const score = rendezvousScore(key, id);
    // Tie-break on id keeps the result independent of `vehicleIds` order.
    if (score > bestScore || (score === bestScore && bestId !== null && id < bestId)) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId;
}
