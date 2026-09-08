"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

/** Vider le panier n'a de sens qu'une fois la commande réellement créée en
 * base — donc seulement au montage de cette page de confirmation, jamais de
 * façon optimiste avant l'appel serveur. clear() est idempotent : un double
 * appel (StrictMode) n'a aucun effet indésirable. */
export function ClearCartOnMount() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
