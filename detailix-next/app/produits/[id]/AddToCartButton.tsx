"use client";

import { CartStore } from "@/components/cart/CartStore";

interface Props {
  productId: string;
  name: string;
  price: number;
  disabled?: boolean;
}

export function AddToCartButton({ productId, name, price, disabled }: Props) {
  function handle() {
    CartStore.add({ productId, name, price });
  }

  return (
    <button
      className="btn btn-primary"
      onClick={handle}
      disabled={disabled}
      style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "var(--text-base)" }}
      aria-label={disabled ? "Produit indisponible" : `Ajouter ${name} au panier`}
    >
      {disabled ? "Indisponible" : "Ajouter au panier"}
    </button>
  );
}
