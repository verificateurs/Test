"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CartStore, type CartItem } from "./CartStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

const noopSubscribe = () => () => {};

/** True once hydrated on the client. Server + first client render agree on
 * `false`, so there is no hydration mismatch. */
function useHasMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function CartDrawer({ open, onClose }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  // The drawer is rendered inside <SiteHeader>, which has `backdrop-filter`
  // applied — that property establishes a containing block for `position:
  // fixed` descendants, so without a portal the drawer would be pinned
  // relative to the (short) header instead of the viewport.
  const mounted = useHasMounted();

  useEffect(() => {
    const update = () => setItems([...CartStore.getItems()]);
    update();
    return CartStore.subscribe(update);
  }, []);

  const total = CartStore.total();

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`drawer-overlay${open ? " open" : ""}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`drawer${open ? " open" : ""}`}
        aria-label="Panier"
        role="dialog"
        aria-modal
      >
        <div className="drawer-header">
          <h2 style={{ fontSize: "var(--text-xl)" }}>Mon panier</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Fermer le panier">✕</button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "var(--space-2xl)" }}>
              Votre panier est vide.
            </p>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="drawer-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, overflowWrap: "anywhere" }}>{item.name}</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--accent)" }}>
                    {item.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexShrink: 0 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => CartStore.updateQty(item.productId, item.qty - 1)}
                    aria-label="Diminuer la quantité"
                  >−</button>
                  <span style={{ minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => CartStore.updateQty(item.productId, item.qty + 1)}
                    aria-label="Augmenter la quantité"
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginBottom: "var(--space-md)" }}>
              <span>Total TTC</span>
              <span style={{ color: "var(--accent)" }}>
                {total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            </div>
            <Link
              href="/commande"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={onClose}
            >
              Passer la commande
            </Link>
          </div>
        )}
      </aside>

      <style jsx>{`
        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg);
          border-bottom: 1px solid var(--border);
        }
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-md);
        }
        .drawer-item {
          display: flex;
          gap: var(--space-md);
          padding: var(--space-md) 0;
          border-bottom: 1px solid var(--border);
        }
        .drawer-footer {
          padding: var(--space-lg);
          border-top: 1px solid var(--border);
        }
        @media (max-width: 480px) {
          .drawer-header,
          .drawer-footer { padding: var(--space-md); }
          .drawer-item { gap: var(--space-sm); }
        }
      `}</style>
    </>,
    document.body
  );
}
