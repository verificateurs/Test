"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { createOrderAction, type CheckoutActionState } from "./actions";

const initialState: CheckoutActionState = { error: null };

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function CommandePage() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const [state, formAction, pending] = useActionState(createOrderAction, initialState);
  const [prefillEmail, setPrefillEmail] = useState("");

  useEffect(() => {
    if (items.length === 0 && !pending) router.replace("/panier");
  }, [items.length, pending, router]);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.loggedIn && data.email) setPrefillEmail(data.email);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container checkout-layout">
            <form action={formAction} className="checkout-form">
              <h1>Livraison</h1>
              <input type="hidden" name="cartItems" value={JSON.stringify(items.map((i) => ({ productId: i.productId, qty: i.qty })))} />

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  defaultValue={state.values?.email ?? prefillEmail}
                />
              </label>
              <label>
                Nom complet
                <input type="text" name="shippingName" required maxLength={120} autoComplete="name" defaultValue={state.values?.shippingName ?? ""} />
              </label>
              <label>
                Adresse
                <input
                  type="text"
                  name="shippingAddr"
                  required
                  maxLength={200}
                  autoComplete="street-address"
                  defaultValue={state.values?.shippingAddr ?? ""}
                />
              </label>
              <div className="form-row">
                <label>
                  Code postal
                  <input
                    type="text"
                    name="shippingZip"
                    required
                    pattern="[0-9]{5}"
                    autoComplete="postal-code"
                    defaultValue={state.values?.shippingZip ?? ""}
                  />
                </label>
                <label>
                  Ville
                  <input type="text" name="shippingCity" required maxLength={120} autoComplete="address-level2" defaultValue={state.values?.shippingCity ?? ""} />
                </label>
              </div>
              <label>
                Code promo (facultatif)
                <input type="text" name="promoCode" maxLength={40} defaultValue={state.values?.promoCode ?? ""} />
              </label>

              {state.error && <p className="form-error">{state.error}</p>}

              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? "Validation…" : "Valider la commande"}
              </button>
              <p className="form-hint">
                Paiement en mode démonstration pour ce lot — <Link href="/panier">retour au panier</Link>.
              </p>
            </form>

            <aside className="order-summary">
              <h2>Récapitulatif</h2>
              <ul className="order-summary-lines">
                {items.map((item) => (
                  <li key={item.productId}>
                    <span>
                      {item.qty} × {item.name}
                    </span>
                    <span>{formatPrice(item.unitPriceSnapshot * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="order-summary-subtotal">
                Sous-total <span>{formatPrice(subtotal)}</span>
              </p>
              <p className="form-hint">Frais de port et remise éventuelle appliqués après validation.</p>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
