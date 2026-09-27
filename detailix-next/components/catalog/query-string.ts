/**
 * Clones the current URL search params, applies the given updates (null/"" removes the key)
 * and drops `page` so any filter/sort change lands back on page 1. Shared by FilterPanel and
 * SortSelect so both push URLs the same way.
 */
export function withFilterParams(
  current: URLSearchParams,
  updates: Record<string, string | null>
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  next.delete("page");
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
