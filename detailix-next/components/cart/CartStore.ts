"use client";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

const LISTENERS = new Set<() => void>();
let _items: CartItem[] = [];

try {
  const raw = typeof window !== "undefined" && sessionStorage.getItem("detailix_cart");
  if (raw) _items = JSON.parse(raw);
} catch {}

function persist() {
  try { sessionStorage.setItem("detailix_cart", JSON.stringify(_items)); } catch {}
}

function notify() {
  for (const fn of LISTENERS) fn();
}

export const CartStore = {
  getItems: () => _items,

  add(item: Omit<CartItem, "qty"> & { qty?: number }) {
    const existing = _items.find((i) => i.productId === item.productId);
    if (existing) {
      existing.qty += item.qty ?? 1;
    } else {
      _items = [..._items, { ...item, qty: item.qty ?? 1 }];
    }
    persist();
    notify();
  },

  remove(productId: string) {
    _items = _items.filter((i) => i.productId !== productId);
    persist();
    notify();
  },

  updateQty(productId: string, qty: number) {
    if (qty <= 0) { CartStore.remove(productId); return; }
    _items = _items.map((i) => i.productId === productId ? { ...i, qty } : i);
    persist();
    notify();
  },

  clear() {
    _items = [];
    persist();
    notify();
  },

  total() {
    return _items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  subscribe(fn: () => void) {
    LISTENERS.add(fn);
    return () => { LISTENERS.delete(fn); };
  },
};
