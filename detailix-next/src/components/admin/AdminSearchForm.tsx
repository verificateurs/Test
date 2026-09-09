export function AdminSearchForm({ q, placeholder }: { q: string; placeholder?: string }) {
  return (
    <form method="get" className="admin-search-form" role="search">
      <input type="search" name="q" defaultValue={q} placeholder={placeholder ?? "Rechercher…"} aria-label="Rechercher" />
      <button type="submit" className="btn-secondary">
        Rechercher
      </button>
    </form>
  );
}
