"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { withFilterParams } from "./query-string";
import type { SortOption } from "@/lib/catalog-query";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "nom", label: "Nom (A–Z)" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  // TODO: ajouter tri "note" une fois ProductReview disponible
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawSort = searchParams.get("sort");
  const sort = SORT_OPTIONS.some((opt) => opt.value === rawSort) ? (rawSort as SortOption) : "nom";

  function onChange(value: string) {
    router.push(`${pathname}${withFilterParams(searchParams, { sort: value === "nom" ? null : value })}`);
  }

  return (
    <div className="sort-select">
      <label htmlFor="catalog-sort">Trier par</label>
      <select id="catalog-sort" value={sort} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <style jsx>{`
        .sort-select {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: var(--text-sm);
        }
        .sort-select label {
          color: var(--text-muted);
          white-space: nowrap;
        }
        .sort-select select {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: var(--text-sm);
          padding: 8px 10px;
          outline: none;
        }
        .sort-select select:focus {
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
