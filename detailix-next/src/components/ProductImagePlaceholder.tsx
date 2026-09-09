/** Repli générique unique quand aucune photo produit n'est disponible — pas
 *  une icône par catégorie, aucun système d'icônes n'existe à étendre et 12
 *  icônes pour un simple repli serait hors de proportion. */
export function ProductImagePlaceholder({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="Photo non disponible"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="14" y="22" width="36" height="30" rx="3" />
      <path d="M24 22v-4a8 8 0 0 1 16 0v4" />
      <circle cx="32" cy="36" r="6" />
      <path d="M29 36l2 2 4-4" />
    </svg>
  );
}
