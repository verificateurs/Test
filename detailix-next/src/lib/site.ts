/**
 * URL de base du site, utilisée pour les canonical, Open Graph et le sitemap.
 * En production, définir NEXT_PUBLIC_SITE_URL (ex. https://detailix.fr).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "Detailix";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
