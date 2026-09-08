"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Panier 100% client (Context + localStorage), sans table serveur — les pages
 * catalogue restent statiques, le panier est une île posée par-dessus.
 *
 * `unitPriceSnapshot` sert uniquement à l'affichage dans le panier avant
 * commande. Il n'est JAMAIS envoyé tel quel au serveur comme prix de vérité :
 * createOrder() recalcule chaque prix depuis Product.prixAchat + la marge
 * courante en base. Un visiteur qui modifierait cette valeur dans le
 * localStorage ne changerait donc rien au montant réellement facturé.
 */

export type CartItem = {
  productId: string;
  name: string;
  format: string;
  unitPriceSnapshot: number;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  /** false tant que le panier n'a pas été relu depuis localStorage (juste
   * après le montage) — avant ça, `items` vaut [] même si un panier existe
   * réellement. Les pages qui redirigent sur "panier vide" doivent attendre
   * hydrated=true, sinon un chargement direct de /commande (F5, lien externe)
   * redirige à tort vers /panier avant que le panier n'ait pu se charger. */
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "detailix:cart:v1";
const MAX_QTY_PER_LINE = 99;

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem =>
        i &&
        typeof i.productId === "string" &&
        typeof i.name === "string" &&
        typeof i.format === "string" &&
        typeof i.unitPriceSnapshot === "number" &&
        Number.isInteger(i.qty) &&
        i.qty > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // évite d'écraser le storage avant le premier chargement
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* stockage indisponible (navigation privée, quota) : le panier reste en mémoire pour la session */
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY_PER_LINE) } : i
        );
      }
      return [...prev, { ...item, qty: Math.min(qty, MAX_QTY_PER_LINE) }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty: Math.min(qty, MAX_QTY_PER_LINE) } : i)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.unitPriceSnapshot * i.qty, 0), [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, hydrated, addItem, removeItem, setQty, clear }),
    [items, count, subtotal, hydrated, addItem, removeItem, setQty, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé sous CartProvider");
  return ctx;
}
