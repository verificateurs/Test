export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompat } from "@/lib/compat";
import { ProductCard } from "@/components/ProductCard";
import { buildCatalogQuery, computeTotalPages, type RawSearchParams } from "@/lib/catalog-query";
import { getGarageVehicle } from "@/lib/garage";
import { getWishlistedProductIds } from "@/lib/wishlist";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import { Breadcrumb, JsonLd, breadcrumbJsonLd } from "@/components/Breadcrumb";
import type { Metadata } from "next";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

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
    alternates: { canonical: `/marques/${brand.id}` },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  // reviews: non chargées — voir note plus bas (avis générés, pas affichés publiquement).
  const brand = await db.brand.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!brand) notFound();

  const vehicle = await getGarageVehicle();

  const query = buildCatalogQuery(resolvedSearchParams, {
    brandId: id,
    vehicleCodeMoteur: vehicle?.codeMoteur,
    vehiclePlatform: vehicle?.platform,
  });

  const [products, total, brandProductCount] = await Promise.all([
    db.product.findMany({
      where: query.where,
      orderBy: query.orderBy,
      skip: query.skip,
      take: query.take,
      select: { id: true, name: true, prixAchat: true, stockQty: true, categoryId: true, compatibilite: true, brand: { select: { name: true } } },
    }),
    db.product.count({ where: query.where }),
    db.product.count({ where: { brandId: id } }),
  ]);
  const totalPages = computeTotalPages(total, query.pageSize);
  if (query.page > totalPages) notFound();
  const hasAnyProducts = brandProductCount > 0;

  const wishlistedIds = await getWishlistedProductIds(products.map((p) => p.id));

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: brand.category.label, href: `/categories/${brand.categoryId}` },
    { label: brand.name },
  ];

  return (
    <div className="page-enter">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, BASE_URL)} />

      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <Breadcrumb items={breadcrumbItems} />
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
            </div>
          </div>
        </div>
      </div>

      {/* Produits */}
      {hasAnyProducts && (
        <section style={{ padding: "var(--space-xl) 0" }}>
          <div className="container">
            <div style={{ display: "flex", gap: "var(--space-xl)", flexWrap: "wrap", alignItems: "flex-start" }}>
              <div style={{ flex: "1 1 260px", maxWidth: 320 }}>
                <FilterPanel vehicleLabel={vehicle ? `${vehicle.marque} ${vehicle.modele}` : null} />
              </div>

              <div style={{ flex: "3 1 480px", minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", gap: "var(--space-md)", flexWrap: "wrap" }}>
                  <h2 style={{ fontSize: "var(--text-xl)" }}>{total} produit{total !== 1 ? "s" : ""}</h2>
                  <SortSelect />
                </div>

                {products.length === 0 ? (
                  <div style={{ padding: "var(--space-3xl) 0", textAlign: "center", color: "var(--text-muted)" }}>
                    Aucun produit ne correspond à ces filtres.
                  </div>
                ) : (
                  <div className="product-grid">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={p.name}
                        brandName={p.brand.name}
                        categoryId={p.categoryId}
                        price={computePrice(p.prixAchat)}
                        stockQty={p.stockQty}
                        compat={parseCompat(p.compatibilite)}
                        wishlisted={wishlistedIds.has(p.id)}
                      />
                    ))}
                  </div>
                )}

                <div style={{ marginTop: "var(--space-xl)" }}>
                  <Pagination page={query.page} totalPages={totalPages} searchParams={resolvedSearchParams} />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Avis clients : masqués côté public — données 100% générées (voir data/generate-products.ts),
          les afficher comme de vrais avis serait une pratique commerciale trompeuse. Les lignes
          restent en base (BrandReview) pour un usage interne/futur, simplement pas rendues ici. */}
    </div>
  );
}
