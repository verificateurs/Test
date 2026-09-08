"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function PanierPage() {
  const { items, subtotal, setQty, removeItem, clear } = useCart();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Mon panier</h1>

            {items.length === 0 ? (
              <p className="section-intro">
                Votre panier est vide. <Link href="/categories">Parcourir le catalogue</Link>.
              </p>
            ) : (
              <>
                <div className="cart-table-wrap">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix unitaire</th>
                        <th>Quantité</th>
                        <th>Total</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.productId}>
                          <td>
                            <Link href={`/produits/${item.productId}`}>{item.name}</Link>
                            <div className="cart-line-format">{item.format}</div>
                          </td>
                          <td>{formatPrice(item.unitPriceSnapshot)}</td>
                          <td>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={item.qty}
                              aria-label={`Quantité pour ${item.name}`}
                              onChange={(e) => {
                                const next = Number(e.target.value);
                                if (Number.isInteger(next)) setQty(item.productId, next);
                              }}
                              className="cart-qty-input"
                            />
                          </td>
                          <td>{formatPrice(item.unitPriceSnapshot * item.qty)}</td>
                          <td>
                            <button type="button" className="link-button" onClick={() => removeItem(item.productId)}>
                              Retirer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cart-summary">
                  <button type="button" className="link-button" onClick={clear}>
                    Vider le panier
                  </button>
                  <p className="cart-subtotal">
                    Sous-total : <strong>{formatPrice(subtotal)}</strong>
                  </p>
                  <p className="form-hint">Frais de port et code promo calculés à l&apos;étape suivante.</p>
                  <Link href="/commande" className="btn-primary">
                    Passer la commande
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
