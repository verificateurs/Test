export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompatCodes } from "@/lib/compat";
import { ProductCard } from "@/components/ProductCard";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const brands = await db.brand.findMany({ select: { id: true } });
  return brands.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const brand = await db.brand.findUnique({ where: { id } });
  if (!brand) return { title: "Marque introuvable" };
  return {
    title: `${brand.name} — ${brand.gamme}`,
    description: brand.preference,
  };
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span className="stars" aria-label={`Note : ${rating} sur 5`}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const brand = await db.brand.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: { orderBy: { id: "desc" } },
      products: { select: { id: true, name: true, prixAchat: true, stockQty: true, categoryId: true, compatibilite: true, brand: { select: { name: true } } }, orderBy: { name: "asc" } },
    },
  });
  if (!brand) notFound();

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <nav style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          <Link href="/">Accueil</Link>
          {" / "}
          <Link href={`/categories/${brand.categoryId}`}>{brand.category.label}</Link>
          {" / "}
          <span style={{ color: "var(--text)" }}>{brand.name}</span>
        </nav>
      </div>

      {/* Header marque */}
      <div className="container" style={{ paddingBottom: "var(--space-xl)" }}>
        <div style={{ display: "flex", gap: "var(--space-xl)", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center", marginBottom: "var(--space-sm)" }}>
              <h1 style={{ margin: 0 }}>{brand.name}</h1>
              {brand.recommended && (
                <span className="badge badge-compat" style={{ fontSize: "var(--text-xs)" }}>Recommandé</span>
              )}
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-md)" }}>{brand.preference}</p>
            <div style={{ display: "flex", flexWrap: "wrap", rowGap: "var(--space-sm)", gap: "var(--space-lg)", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              <span>Origine : <strong style={{ color: "var(--text)" }}>{brand.origine}</strong></span>
              <span>Gamme : <strong style={{ color: "var(--text)" }}>{brand.gamme}</strong></span>
              <span>
                <Stars rating={brand.rating} />
                <strong style={{ color: "var(--text)", marginLeft: 4 }}>{brand.rating}</strong>
                <span style={{ marginLeft: 4 }}>({brand.reviewCount} avis)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Produits */}
      {brand.products.length > 0 && (
        <section style={{ padding: "var(--space-xl) 0" }}>
          <div className="container">
            <h2 style={{ marginBottom: "var(--space-lg)", fontSize: "var(--text-xl)" }}>
              {brand.products.length} produit{brand.products.length !== 1 ? "s" : ""}
            </h2>
            <div className="product-grid">
              {brand.products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  brandName={p.brand.name}
                  categoryId={p.categoryId}
                  price={computePrice(p.prixAchat)}
                  stockQty={p.stockQty}
                  compatCodes={parseCompatCodes(p.compatibilite)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avis clients */}
      {brand.reviews.length > 0 && (
        <section style={{ padding: "var(--space-xl) 0", background: "var(--bg-elevated)", borderTop: "1px solid var(--border)" }}>
          <div className="container">
            <h2 style={{ marginBottom: "var(--space-lg)", fontSize: "var(--text-xl)" }}>Avis clients</h2>
            <div style={{ display: "grid", gap: "var(--space-md)", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {brand.reviews.map((rv) => (
                <div key={rv.id} style={{ background: "var(--bg-card)", borderRadius: "var(--radius)", padding: "var(--space-lg)", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-sm)" }}>
                    <strong>{rv.author}</strong>
                    <Stars rating={rv.rating} />
                  </div>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.6 }}>{rv.comment}</p>
                  <div style={{ marginTop: "var(--space-sm)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{rv.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
