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
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

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

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, maxWidth: 320 }}>
      <input
        type="search"
        placeholder="Rechercher un produit, une marque…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-label="Recherche"
        style={{
          width: "100%",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text)",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          padding: "8px 14px",
          outline: "none",
        }}
      />

      <div className={`search-dropdown${open ? " open" : ""}`} role="listbox">
        {results.map((r) => (
          <Link
            key={`${r.type}-${r.id}`}
            href={r.type === "product" ? `/produits/${r.id}` : `/marques/${r.id}`}
            onClick={() => { setOpen(false); setQuery(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: "var(--text-sm)",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
              {r.type === "product" ? "Produit" : "Marque"}
            </span>
            <span>{r.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
