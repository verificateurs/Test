export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompat, isCompatible } from "@/lib/compat";
import { getGarageVehicle } from "@/lib/garage";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/ProductCard";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { Breadcrumb, JsonLd, breadcrumbJsonLd } from "@/components/Breadcrumb";
import { AddToCartButton } from "./AddToCartButton";
import type { Metadata } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { id: true } });
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, include: { brand: true } });
  if (!p) return { title: "Produit introuvable" };
  return {
    title: `${p.name} — ${p.format} | ${p.brand.name}`,
    description: p.description,
    alternates: { canonical: `/produits/${p.id}` },
    openGraph: {
      siteName: "Detailix",
      locale: "fr_FR",
      type: "website",
      title: `${p.name} — ${p.format}`,
      description: p.description,
      images: [{ url: `/api/product-image/${p.id}`, width: 800, height: 600 }],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      brand: { include: { category: true } },
    },
  });
  if (!product) notFound();

  // Never expose prixAchat — compute displayed price
  const price = computePrice(product.prixAchat);
  const inStock = product.stockQty > 0;

  const compat = parseCompat(product.compatibilite);
  const vehicle = await getGarageVehicle();
  const compatible: boolean | null =
    compat?.mode === "universel" ? true : compat && vehicle ? isCompatible(compat, vehicle) : null;

  const sameBrandProducts = await db.product.findMany({
    where: { brandId: product.brandId, id: { not: product.id } },
    take: 4,
    select: { id: true, name: true, prixAchat: true, stockQty: true, categoryId: true, compatibilite: true },
  });

  const wishlistedIds = await getWishlistedProductIds([product.id, ...sameBrandProducts.map((p) => p.id)]);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: product.brand.category.label, href: `/categories/${product.brand.categoryId}` },
    { label: product.brand.name, href: `/marques/${product.brandId}` },
    { label: product.name },
  ];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${BASE_URL}/api/product-image/${product.id}`,
    brand: { "@type": "Brand", name: product.brand.name },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "EUR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/produits/${product.id}`,
    },
  };

  return (
    <div className="page-enter">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, BASE_URL)} />

      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="container" style={{ paddingBottom: "var(--space-3xl)" }}>
        <div className="product-detail-grid">

          {/* Image */}
          <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-card)" }}>
            <Image
              src={`/api/product-image/${product.id}`}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Infos */}
          <div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>
              <Link href={`/marques/${product.brandId}`} style={{ color: "var(--accent)" }}>{product.brand.name}</Link>
              {" — "}
              {product.format}
            </div>

            <h1 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-md)" }}>{product.name}</h1>

            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "var(--space-xl)" }}>
              {product.description}
            </p>

            {/* Prix */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginBottom: "var(--space-lg)" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>
                {price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>TTC</span>
              <WishlistButton productId={product.id} initialSaved={wishlistedIds.has(product.id)} />
            </div>

            {/* Stock */}
            <div style={{ marginBottom: "var(--space-md)", display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
              <span className={`badge ${inStock ? "badge-stock" : "badge-no-stock"}`}>
                {inStock ? `En stock (${product.stockQty})` : "Rupture de stock"}
              </span>
              {compatible === true && (
                <span className="badge badge-compat">✓ Compatible avec votre véhicule</span>
              )}
              {compatible === false && (
                <span className="badge badge-incompat">✗ Non compatible avec votre véhicule</span>
              )}
            </div>

            {/* CTA */}
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={price}
              disabled={!inStock}
            />

            {/* Homologation */}
            {product.homologation && (
              <div style={{ marginTop: "var(--space-lg)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                Homologation :{" "}
                <strong style={{ color: "var(--text)" }}>
                  {product.homologation === "route_ouverte" ? "Route ouverte" :
                   product.homologation === "usage_piste" ? "Usage piste uniquement" :
                   "Non applicable"}
                </strong>
              </div>
            )}

            {/* Compatibilité */}
            {compat?.mode === "universel" && (
              <div style={{ marginTop: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                Compatible avec tous véhicules
              </div>
            )}
            {compat && compat.mode !== "universel" && compat.codes.length > 0 && (
              <div style={{ marginTop: "var(--space-lg)", padding: "var(--space-md)", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-sm)", fontSize: "var(--text-sm)" }}>
                  {compat.mode === "codesMoteurs" ? "Codes moteur compatibles" : "Châssis compatibles"}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
                  {compat.codes.map((code) => (
                    <span key={code} className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: "var(--text-xs)" }}>
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Produits de la même marque */}
        {sameBrandProducts.length > 0 && (
          <section style={{ marginTop: "var(--space-3xl)" }}>
            <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-lg)" }}>
              Autres produits {product.brand.name}
            </h2>
            <div className="product-grid">
              {sameBrandProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  brandName={product.brand.name}
                  categoryId={p.categoryId}
                  price={computePrice(p.prixAchat)}
                  stockQty={p.stockQty}
                  compat={parseCompat(p.compatibilite)}
                  wishlisted={wishlistedIds.has(p.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
