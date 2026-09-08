"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/panier" className="cart-link" aria-label="Voir le panier">
      🛒{count > 0 && <span className="cart-count">{count}</span>}
    </Link>
  );
}
