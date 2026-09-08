import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getMarginPercent, computeSellPrice, formatPrice } from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ConfirmDeleteForm } from "@/components/admin/ConfirmDeleteForm";
import { removeFromWishlistAction } from "./actions";

export const metadata: Metadata = { title: "Ma liste d'envies", robots: { index: false } };

export default async function WishlistPage() {
  // compte/layout.tsx a déjà appelé requireUser() ; session non-nulle garantie ici.
  const session = await getSession();
  const userId = session!.user.id;

  const [items, marginPercent] = await Promise.all([
    prisma.wishlistItem.findMany({
      where: { userId },
      include: { product: { include: { brand: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getMarginPercent(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Ma liste d&apos;envies</h1>

            {items.length === 0 ? (
              <p className="section-intro">
                Aucun produit enregistré. <Link href="/categories">Parcourir le catalogue</Link>.
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Marque</th>
                    <th>Prix</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/produits/${item.product.id}`}>{item.product.name}</Link>
                      </td>
                      <td>{item.product.brand.name}</td>
                      <td>{formatPrice(computeSellPrice(item.product.prixAchat, marginPercent))}</td>
                      <td>
                        <ConfirmDeleteForm
                          action={removeFromWishlistAction}
                          hiddenFields={{ productId: item.product.id }}
                          confirmMessage={`Retirer "${item.product.name}" de votre liste d'envies ?`}
                          label="Retirer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
