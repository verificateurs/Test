export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { AddToCartButton } from "./AddToCartButton";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const products = await db.product.findMany({ select: { id: true } });
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = await db.product.findUnique({ where: { id }, include: { brand: true } });
  if (!p) return { title: "Produit introuvable" };
  return {
    title: `${p.name} — ${p.brand.name}`,
    description: p.description,
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

  let compatMakes: string[] = [];
  try {
    const c = typeof product.compatibilite === "string"
      ? JSON.parse(product.compatibilite)
      : product.compatibilite;
    if (c && c.type === "codesMoteurs" && Array.isArray(c.codes)) {
      compatMakes = c.codes;
    }
  } catch {}

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <nav style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <Link href="/">Accueil</Link>
          {" / "}
          <Link href={`/categories/${product.brand.categoryId}`}>{product.brand.category.label}</Link>
          {" / "}
          <Link href={`/marques/${product.brandId}`}>{product.brand.name}</Link>
          {" / "}
          <span style={{ color: "var(--text)" }}>{product.name}</span>
        </nav>
      </div>

      <div className="container" style={{ paddingBottom: "var(--space-3xl)" }}>
        <div className="product-detail-grid">

          {/* Image */}
          <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--bg-card)" }}>
            <Image
              src={`/products/${product.id}.webp`}
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
            </div>

            {/* Stock */}
            <div style={{ marginBottom: "var(--space-lg)" }}>
              <span className={`badge ${inStock ? "badge-stock" : "badge-no-stock"}`}>
                {inStock ? `En stock (${product.stockQty})` : "Rupture de stock"}
              </span>
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
            {compatMakes.length > 0 && (
              <div style={{ marginTop: "var(--space-lg)", padding: "var(--space-md)", background: "var(--bg-card)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600, marginBottom: "var(--space-sm)", fontSize: "var(--text-sm)" }}>
                  Codes moteur compatibles
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
                  {compatMakes.map((code) => (
                    <span key={code} className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: "var(--text-xs)" }}>
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {compatMakes.length === 0 && (
              <div style={{ marginTop: "var(--space-md)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                Compatible avec tous véhicules
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
