import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Fiches préparateurs (Shiftech, BR Performance...) : contenu éditorial qui
 * ne change quasiment jamais et n'est pas géré par les utilisateurs — lu
 * depuis ../../../data/preparateurs.json (source unique déjà présente dans
 * le dépôt) plutôt que dupliqué dans un modèle Prisma + panel admin dédié.
 * Lu au build (routes force-static) : le module-level cache évite de
 * reparser le fichier pour chaque page générée par generateStaticParams.
 *
 * Ces avis sont des données d'exemple (voir le champ `_note` du fichier
 * source) : comme pour les marques, aucun balisage schema.org
 * Review/AggregateRating n'est ajouté tant qu'ils ne sont pas remplacés par
 * de vrais avis, pour ne pas enfreindre les règles de Google sur les
 * données structurées.
 */

export type CentreReview = { author: string; rating: number; date: string; comment: string };
export type Centre = { id: string; ville: string; rating: number; reviewCount: number; reviews: CentreReview[] };
export type Reseau = { id: string; name: string; specialite: string; description: string; centres: Centre[] };

const DATA_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "data", "preparateurs.json");

let cache: Reseau[] | null = null;

export function getReseaux(): Reseau[] {
  if (!cache) {
    const raw = JSON.parse(readFileSync(DATA_FILE, "utf8")) as { reseaux: Reseau[] };
    cache = raw.reseaux;
  }
  return cache;
}

export function getCentre(centreId: string): { centre: Centre; reseau: Reseau } | null {
  for (const reseau of getReseaux()) {
    const centre = reseau.centres.find((c) => c.id === centreId);
    if (centre) return { centre, reseau };
  }
  return null;
}
