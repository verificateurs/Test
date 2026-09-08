"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Comparateur sans état serveur : la sélection vit en localStorage (comme le
 * panier) et la page /comparateur elle-même est pilotée uniquement par l'URL
 * (?compare=id1,id2,...), donc partageable telle quelle. Ce contexte ne sert
 * qu'à construire ce lien depuis les pages de listing.
 */

const STORAGE_KEY = "detailix:comparateur:v1";
const MAX_ITEMS = 4;

type ComparatorContextValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
};

const ComparatorContext = createContext<ComparatorContextValue | null>(null);

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function ComparatorProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIds(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* stockage indisponible : la sélection reste en mémoire pour la session */
    }
  }, [ids, hydrated]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_ITEMS ? prev : [...prev, id]));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({ ids, has, toggle, clear }), [ids, has, toggle, clear]);

  return <ComparatorContext.Provider value={value}>{children}</ComparatorContext.Provider>;
}

export function useComparator(): ComparatorContextValue {
  const ctx = useContext(ComparatorContext);
  if (!ctx) throw new Error("useComparator doit être utilisé sous ComparatorProvider");
  return ctx;
}

export const COMPARATOR_MAX_ITEMS = MAX_ITEMS;
