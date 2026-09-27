"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface SearchResult {
  type: "product" | "brand";
  id: string;
  name: string;
  categoryId?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recherche-index?q=${encodeURIComponent(query)}`);
        if (!res.ok) return;
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {}
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="search-bar">
      <input
        type="search"
        placeholder="Rechercher un produit, une marque…"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Recherche"
        className="search-input"
      />

      <div className={`search-dropdown${open ? " open" : ""}`} role="listbox">
        {results.map((r) => (
          <Link
            key={`${r.type}-${r.id}`}
            href={r.type === "product" ? `/produits/${r.id}` : `/marques/${r.id}`}
            onClick={() => handleQueryChange("")}
            className="search-result"
          >
            <span className="search-result-type">
              {r.type === "product" ? "Produit" : "Marque"}
            </span>
            <span>{r.name}</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .search-bar {
          position: relative;
          flex: 1;
          max-width: 320px;
        }
        .search-input {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text);
          font-family: var(--font-body);
          font-size: var(--text-sm);
          padding: 8px 14px;
          transition: border-color 0.15s;
        }
        .search-input:focus-visible {
          border-color: var(--accent-2);
          box-shadow: 0 0 0 3px rgba(255, 212, 0, 0.15);
        }
        .search-result {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 10px 14px;
          border-bottom: 1px solid var(--border);
          font-size: var(--text-sm);
          transition: background 0.1s;
        }
        .search-result:hover,
        .search-result:focus-visible {
          background: var(--bg-card);
        }
        .search-result-type {
          color: var(--text-muted);
          font-size: var(--text-xs);
        }
      `}</style>
    </div>
  );
}
