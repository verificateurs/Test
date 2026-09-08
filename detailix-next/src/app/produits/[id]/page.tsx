import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getProduct,
  getMarginPercent,
  computeSellPrice,
  formatPrice,
  deliveryEstimate,
  parseCompatibilite,
  compatibilityStatus,
  COMPAT_LABELS,
  HOMOLOGATION_LABELS,
} from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { AddToCartButton } from "@/components/AddToCartButton";
import { WishlistToggleButton } from "@/components/WishlistToggleButton";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { id: true } });
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return {};
  const title = `${product.name} — ${product.brand.name}`;
  const description = `${product.name} (${product.format}) par ${product.brand.name}. ${product.description}`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/produits/${product.id}`) },
    openGraph: { title, description, url: absoluteUrl(`/produits/${product.id}`), type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const marginPercent = await getMarginPercent();
  const price = computeSellPrice(product.prixAchat, marginPercent);
  const delivery = deliveryEstimate(product.stock);
  const compat = COMPAT_LABELS[compatibilityStatus(parseCompatibilite(product.compatibilite), null)];
  const homolog = product.homologation ? HOMOLOGATION_LABELS[product.homologation] : null;

  return (
    <>
      <SiteHeader />
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: product.category.label, href: `/categories/${product.category.id}` },
          { label: product.brand.name, href: `/marques/${product.brand.id}` },
          { label: product.name },
        ]}
      />
      {/* Product + offers : éligibilité aux résultats enrichis (prix, dispo).
          Pas d'aggregateRating/review : les avis sont des exemples (règles Google). */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          sku: product.id,
          brand: { "@type": "Brand", name: product.brand.name },
          category: product.category.label,
          offers: {
            "@type": "Offer",
            price: price.toFixed(2),
            priceCurrency: "EUR",
            availability: product.stock === false ? "https://schema.org/BackOrder" : "https://schema.org/InStock",
            url: absoluteUrl(`/produits/${product.id}`),
          },
        }}
      />
      <main>
        <section className="section">
          <div className="container product-detail">
            <div>
              <p className="product-detail-brand">
                <Link href={`/marques/${product.brand.id}`}>{product.brand.name}</Link>
              </p>
              <h1>{product.name}</h1>
              <p className="brand-meta">{product.format}</p>
              <p>{product.description}</p>

              <div className="badge-row">
                <span className={`delivery-badge ${delivery.className}`}>{delivery.label}</span>
                <span className={`compat-badge ${compat.className}`}>{compat.label}</span>
                {homolog && <span className={`homolog-badge ${homolog.className}`}>{homolog.label}</span>}
              </div>

              <p className="product-detail-price">{formatPrice(price)}</p>
              <div className="admin-actions-row">
                {product.stock === false ? (
                  <p className="out-of-stock">Rupture de stock — réapprovisionnement sous 5 à 7 jours</p>
                ) : (
                  <AddToCartButton
                    productId={product.id}
                    name={product.name}
                    format={product.format}
                    unitPriceSnapshot={price}
                  />
                )}
                <WishlistToggleButton productId={product.id} nextPath={`/produits/${product.id}`} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
