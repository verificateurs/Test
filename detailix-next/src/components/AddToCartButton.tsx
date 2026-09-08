"use client";

import { useCart } from "@/lib/cart/CartContext";
import { useToast } from "@/components/Toast";

type Props = { productId: string; name: string; format: string; unitPriceSnapshot: number };

export function AddToCartButton({ productId, name, format, unitPriceSnapshot }: Props) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => {
        addItem({ productId, name, format, unitPriceSnapshot });
        showToast(`${name} ajouté au panier`);
      }}
    >
      Ajouter au panier
    </button>
  );
}
