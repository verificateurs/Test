import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompat } from "@/lib/compat";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function WishlistPage() {
  const user = await requireUser();

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: "desc" },
    include: { product: { include: { brand: true } } },
  });

  return (
    <div className="page-enter" style={{ padding: "var(--space-3xl) 0" }}>
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ marginBottom: "var(--space-xl)" }}>Mes favoris</h1>

        {items.length === 0 ? (
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-xl)", border: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}>
              Vous n&apos;avez encore ajouté aucun produit à vos favoris.
            </p>
            <Link href="/" className="btn btn-primary">Découvrir le catalogue</Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map(({ product }) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                brandName={product.brand.name}
                categoryId={product.categoryId}
                price={computePrice(product.prixAchat)}
                stockQty={product.stockQty}
                compat={parseCompat(product.compatibilite)}
                wishlisted
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
