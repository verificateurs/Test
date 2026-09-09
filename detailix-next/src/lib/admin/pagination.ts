/** Taille de page commune à toutes les listes admin paginées. */
export const ADMIN_PAGE_SIZE = 20;

/** Lit un numéro de page depuis un paramètre d'URL, avec repli sûr sur 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** Lit un terme de recherche libre depuis un paramètre d'URL (borné, sans validation stricte : filtre "contains" côté DB). */
export function parseSearchQuery(raw: string | undefined): string {
  return (raw ?? "").trim().slice(0, 200);
}
