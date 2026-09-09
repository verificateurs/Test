import Link from "next/link";

export function AdminPagination({
  page,
  total,
  pageSize,
  basePath,
  query = {},
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  /** Paramètres additionnels (ex. recherche "q") à préserver d'une page à l'autre. */
  query?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const current = Math.min(page, pages);
  const hrefFor = (p: number) => {
    const params = new URLSearchParams(query);
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <nav className="admin-pagination" aria-label="Pagination">
      {current > 1 ? (
        <Link href={hrefFor(current - 1)}>← Précédent</Link>
      ) : (
        <span className="disabled" aria-disabled="true">
          ← Précédent
        </span>
      )}
      <span>
        Page {current} / {pages}
      </span>
      {current < pages ? (
        <Link href={hrefFor(current + 1)}>Suivant →</Link>
      ) : (
        <span className="disabled" aria-disabled="true">
          Suivant →
        </span>
      )}
    </nav>
  );
}
