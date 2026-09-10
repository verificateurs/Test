"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CartStore } from "@/components/cart/CartStore";
import type { CartItem } from "@/components/cart/CartStore";
import { createOrderAction } from "./actions";

export default function CommandePage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promo, setPromo] = useState("");
  const [state, dispatch, pending] = useActionState(createOrderAction, null);

  useEffect(() => {
    setItems(CartStore.getItems());
    return CartStore.subscribe(() => setItems(CartStore.getItems()));
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  if (items.length === 0) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-lg)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-lg)" }}>Votre panier est vide.</p>
        <Link href="/" className="btn btn-primary">Continuer mes achats</Link>
      </div>
    );
  }

  return (
    <div className="page-enter container" style={{ paddingTop: "var(--space-xl)", paddingBottom: "var(--space-3xl)" }}>
      <h1 style={{ marginBottom: "var(--space-xl)" }}>Récapitulatif de commande</h1>

      {state?.error && (
        <div className="alert alert-error" style={{ marginBottom: "var(--space-lg)" }}>
          {state.error}
        </div>
      )}

      <div className="checkout-grid">

        {/* Items list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {items.map((item) => (
            <div key={item.productId} style={{ display: "flex", gap: "var(--space-lg)", padding: "var(--space-lg)", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  {item.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} × {item.qty}
                </div>
              </div>
              <div style={{ fontWeight: 700, color: "var(--accent)", alignSelf: "center" }}>
                {(item.price * item.qty).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary + checkout form */}
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)", border: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-lg)" }}>Total</h2>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            <span>Sous-total HT</span>
            <span>{(total / 1.2).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            <span>TVA (20%)</span>
            <span>{(total - total / 1.2).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-xl)", fontWeight: 700, fontSize: "var(--text-lg)", borderTop: "1px solid var(--border)", paddingTop: "var(--space-md)" }}>
            <span>Total TTC</span>
            <span style={{ color: "var(--accent)" }}>{total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
          </div>

          <form
            action={dispatch}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}
          >
            <input type="hidden" name="items" value={JSON.stringify(items.map((i) => ({ productId: i.productId, qty: i.qty })))} />

            <div className="form-field">
              <label htmlFor="promo">Code promo (optionnel)</label>
              <input
                id="promo"
                name="promo"
                type="text"
                maxLength={50}
                value={promo}
                onChange={(e) => setPromo(e.target.value.toUpperCase())}
                placeholder="DÉTAILIX10"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending}
              style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "var(--text-base)" }}
            >
              {pending ? "Traitement en cours…" : "Confirmer la commande"}
            </button>
          </form>

          <p style={{ marginTop: "var(--space-md)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center" }}>
            Paiement sécurisé — Demo mode
          </p>
        </div>
      </div>

      <style jsx>{`
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: var(--space-3xl);
          align-items: start;
        }
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: var(--space-xl);
          }
        }
      `}</style>
    </div>
  );
}
