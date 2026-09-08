"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchIndex = {
  products: Array<{ id: string; name: string; description: string; brandName: string; price: string }>;
  brands: Array<{ id: string; name: string; origine: string; categoryId: string; categoryLabel: string }>;
};

type SearchResult =
  | { type: "product"; id: string; name: string; meta: string; price: string }
  | { type: "brand"; id: string; name: string; meta: string };

const MAX_RESULTS = 8;

function search(index: SearchIndex | null, query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q || !index) return [];

  const brandResults: SearchResult[] = index.brands
    .filter((b) => b.name.toLowerCase().includes(q) || b.origine.toLowerCase().includes(q))
    .map((b) => ({ type: "brand", id: b.id, name: b.name, meta: b.categoryLabel }));

  const productResults: SearchResult[] = index.products
    .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    .map((p) => ({ type: "product", id: p.id, name: p.name, meta: p.brandName, price: p.price }));

  return [...brandResults, ...productResults].slice(0, MAX_RESULTS);
}

/**
 * Recherche interne avec autocomplétion, sur des pages statiques : l'index
 * (/api/recherche-index) est chargé une fois à la première frappe, pas au
 * montage — évite un aller-retour réseau sur chaque page pour une fonction
 * que la plupart des visites n'utilisent jamais.
 */
export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  function ensureIndexLoaded() {
    if (index || loading) return;
    setLoading(true);
    fetch("/api/recherche-index")
      .then((r) => r.json())
      .then((data: SearchIndex) => setIndex(data))
      .catch(() => setIndex({ products: [], brands: [] }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, [open]);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(value.trim().length > 0);
    ensureIndexLoaded();
  }

  function handleSelect(result: SearchResult) {
    setOpen(false);
    setQuery("");
    if (result.type === "product") router.push(`/produits/${result.id}`);
    else router.push(`/marques/${result.id}`);
  }

  const results = search(index, query);

  return (
    <div className="search-wrap" ref={wrapRef}>
      <input
        type="search"
        className="search-input"
        placeholder="Rechercher un produit, une marque…"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (query.trim()) setOpen(true);
          ensureIndexLoaded();
        }}
        aria-label="Rechercher dans le catalogue"
      />
      {open && query.trim() && (
        <div className="search-results">
          {loading && !index ? (
            <p className="search-no-results">Recherche…</p>
          ) : results.length === 0 ? (
            <p className="search-no-results">Aucun résultat.</p>
          ) : (
            results.map((r) => (
              <button key={`${r.type}-${r.id}`} type="button" className="search-result-item" onClick={() => handleSelect(r)}>
                <span className="search-result-name">{r.name}</span>
                <span className="search-result-meta">
                  {r.meta}
                  {r.type === "product" ? ` · ${r.price}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
