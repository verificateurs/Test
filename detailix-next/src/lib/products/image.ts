import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Résolution du chemin d'image produit par convention de nommage sur le
 * système de fichiers (`public/products/<productId>.webp`), pas par un
 * champ Prisma : les `id` produit sont déjà des slugs kebab-case stables
 * utilisables tels quels comme noms de fichiers, et ça évite de faire
 * dépendre le pont d'échange JSON de l'admin import/export (qui ne connaît
 * que le catalogue partagé avec data/products.json) d'un asset purement
 * `public/`.
 *
 * `produits/[id]/page.tsx` est force-static (SSG) : la présence/absence
 * d'un fichier photo est donc figée au moment du `next build`, pas par
 * requête — sans incidence tant que les photos sont ajoutées via des
 * commits, mais à garder en tête pour un ajout post-déploiement.
 */

/** Fonction pure et testable — ne touche jamais le système de fichiers. */
export function resolveProductImage(productId: string, availableFiles: ReadonlySet<string>): string | null {
  const filename = `${productId}.webp`;
  return availableFiles.has(filename) ? `/products/${filename}` : null;
}

let cache: Set<string> | null = null;

/** Un seul `readdirSync` par process (cache module), pas un `existsSync` par produit par rendu. */
export function listProductImageFiles(): ReadonlySet<string> {
  if (cache) return cache;
  let entries: string[] = [];
  try {
    entries = readdirSync(join(process.cwd(), "public", "products"), { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".webp"))
      .map((e) => e.name);
  } catch {
    // Dossier absent (avant le premier `mkdir public/products`, ou build sans photos) : aucune image.
    entries = [];
  }
  cache = new Set(entries);
  return cache;
}
