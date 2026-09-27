"use client";

import { useEffect, useState } from "react";
import { CartStore } from "./CartStore";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const update = () =>
      setCount(CartStore.getItems().reduce((n, i) => n + i.qty, 0));
    update();
    return CartStore.subscribe(update);
  }, []);

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(true)}
        aria-label={`Panier (${count} article${count !== 1 ? "s" : ""})`}
        style={{ position: "relative" }}
      >
        Panier
        {count > 0 && (
          <span
            key={count}
            className="cart-count-badge"
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "var(--accent)",
              /* Texte quasi-noir : #fff sur --accent échoue au contraste AA
                 (voir même traitement sur .btn-primary dans globals.css). */
              color: "var(--bg)",
              borderRadius: "99px",
              fontSize: "0.65rem",
              fontWeight: 700,
              minWidth: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
            aria-hidden
          >
            {count}
          </span>
        )}
      </button>
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
