import "server-only";
import { revalidatePath } from "next/cache";

/**
 * La majorité du catalogue est force-static (SSG à la build, pour le SEO).
 * Toute écriture admin doit explicitement revalider les pages affichant les
 * données modifiées, sinon un visiteur continue de voir l'ancien contenu
 * indéfiniment (pas de re-render automatique côté serveur).
 *
 * `revalidatePath(pattern, "page")` avec le segment dynamique littéral
 * ([id]/[slug]) revalide TOUTES les pages générées pour cette route, pas
 * seulement celle visitée en dernier — nécessaire ici car on ne sait pas a
 * priori quelles pages véhicule dépendent d'un produit donné.
 */
export function revalidateCatalogue(): void {
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/categories/[id]", "page");
  revalidatePath("/marques");
  revalidatePath("/marques/[id]", "page");
  revalidatePath("/produits/[id]", "page");
  revalidatePath("/vehicules");
  revalidatePath("/vehicules/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
