import { readFileSync } from "fs";
import { join } from "path";
import type { PreparateurCentre } from "./preparateurs-geo";

export type { PreparateurReview, PreparateurCentre } from "./preparateurs-geo";
export { distanceKm } from "./preparateurs-geo";

let _centres: PreparateurCentre[] | null = null;

/** Reads and flattens data/preparateurs.json (réseaux > centres) into a single list of centres. */
export function getPreparateurCentres(): PreparateurCentre[] {
  if (_centres !== null) return _centres;
  try {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), "data/preparateurs.json"), "utf8")
    );
    const centres: PreparateurCentre[] = [];
    for (const reseau of raw.reseaux ?? []) {
      for (const centre of reseau.centres ?? []) {
        centres.push({
          id: centre.id,
          reseauId: reseau.id,
          reseauName: reseau.name,
          specialite: reseau.specialite,
          description: reseau.description,
          ville: centre.ville,
          departement: centre.departement,
          adresse: centre.adresse,
          telephone: centre.telephone,
          siteWeb: centre.siteWeb,
          latitude: centre.latitude,
          longitude: centre.longitude,
          rating: centre.rating,
          reviewCount: centre.reviewCount,
          reviews: centre.reviews ?? [],
        });
      }
    }
    _centres = centres;
  } catch {
    _centres = [];
  }
  return _centres;
}
