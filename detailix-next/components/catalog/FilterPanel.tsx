"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { withFilterParams } from "./query-string";

interface FilterPanelProps {
  /** Label of the garage's active vehicle (e.g. "BMW Série 3"), or null/undefined if none. */
  vehicleLabel?: string | null;
}

const PRICE_DEBOUNCE_MS = 400;

export function FilterPanel({ vehicleLabel }: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prixMinRef = useRef<HTMLInputElement>(null);
  const prixMaxRef = useRef<HTMLInputElement>(null);

  const prixMin = searchParams.get("prixMin") ?? "";
  const prixMax = searchParams.get("prixMax") ?? "";
  const stockOnly = searchParams.get("stock") === "disponible";
  const compatibleOnly = searchParams.get("compatible") === "true";
  const hasActiveFilters = Boolean(prixMin || prixMax || stockOnly || compatibleOnly);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function apply(updates: Record<string, string | null>) {
    router.push(`${pathname}${withFilterParams(searchParams, updates)}`);
  }

  function onPriceChange(key: "prixMin" | "prixMax", value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      apply({ [key]: value || null });
    }, PRICE_DEBOUNCE_MS);
  }

  function onReset() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (prixMinRef.current) prixMinRef.current.value = "";
    if (prixMaxRef.current) prixMaxRef.current.value = "";
    router.push(pathname);
  }

  return (
    <aside className="catalog-filter-panel" aria-label="Filtres produits">
      <div className="filter-panel-header">
        <h2>Filtres</h2>
        {hasActiveFilters && (
          <button type="button" className="filter-reset" onClick={onReset}>
            Réinitialiser
          </button>
        )}
      </div>

      <div className="filter-group">
        <span className="filter-label">Prix (€)</span>
        <div className="filter-price-row">
          <input
            ref={prixMinRef}
            type="number"
            min={0}
            step="1"
            inputMode="decimal"
            placeholder="Min"
            defaultValue={prixMin}
            onChange={(e) => onPriceChange("prixMin", e.target.value)}
            aria-label="Prix minimum"
          />
          <span className="filter-price-sep" aria-hidden>–</span>
          <input
            ref={prixMaxRef}
            type="number"
            min={0}
            step="1"
            inputMode="decimal"
            placeholder="Max"
            defaultValue={prixMax}
            onChange={(e) => onPriceChange("prixMax", e.target.value)}
            aria-label="Prix maximum"
          />
        </div>
      </div>

      <label className="filter-checkbox">
        <input
          type="checkbox"
          checked={stockOnly}
          onChange={(e) => apply({ stock: e.target.checked ? "disponible" : null })}
        />
        En stock uniquement
      </label>

      {vehicleLabel && (
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={compatibleOnly}
            onChange={(e) => apply({ compatible: e.target.checked ? "true" : null })}
          />
          Compatible avec mon véhicule
          <span className="filter-vehicle-label">({vehicleLabel})</span>
        </label>
      )}

      <style jsx>{`
        .catalog-filter-panel {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .filter-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-sm);
        }
        .filter-panel-header h2 {
          font-size: var(--text-lg);
          margin: 0;
        }
        .filter-reset {
          background: transparent;
          border: none;
          color: var(--accent);
          font-size: var(--text-xs);
          cursor: pointer;
          padding: 0;
        }
        .filter-reset:hover {
          color: var(--accent-hover);
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .filter-label {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 500;
        }
        .filter-price-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }
        .filter-price-row input {
          width: 0;
          flex: 1;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-size: var(--text-sm);
          padding: 8px 10px;
          outline: none;
        }
        .filter-price-row input:focus {
          border-color: var(--accent);
        }
        .filter-price-sep {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          font-size: var(--text-sm);
          color: var(--text);
          cursor: pointer;
        }
        .filter-checkbox input {
          accent-color: var(--accent);
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .filter-vehicle-label {
          color: var(--text-muted);
          font-size: var(--text-xs);
        }
      `}</style>
    </aside>
  );
}
