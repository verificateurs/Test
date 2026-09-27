export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { computePrice } from "@/lib/pricing";
import { parseCompatCodes } from "@/lib/compat";
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
  const cats = await db.category.findMany({ select: { id: true } });
  return cats.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cat = await db.category.findUnique({ where: { id } });
  if (!cat) return { title: "Catégorie introuvable" };
  return {
    title: cat.label,
    description: cat.description,
    alternates: { canonical: `/categories/${cat.id}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  const category = await db.category.findUnique({
    where: { id },
    include: { brands: true },
  });
  if (!category) notFound();

  const vehicle = await getGarageVehicle();

  const query = buildCatalogQuery(resolvedSearchParams, {
    categoryId: id,
    vehicleCodeMoteur: vehicle?.codeMoteur,
  });

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: query.where,
      orderBy: query.orderBy,
      skip: query.skip,
      take: query.take,
      select: { id: true, name: true, prixAchat: true, stockQty: true, categoryId: true, compatibilite: true, brand: { select: { name: true } } },
    }),
    db.product.count({ where: query.where }),
  ]);
  const totalPages = computeTotalPages(total, query.pageSize);
  if (query.page > totalPages) notFound();

  const wishlistedIds = await getWishlistedProductIds(products.map((p) => p.id));

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.label },
  ];

  return (
    <div className="page-enter">
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems, BASE_URL)} />

      {/* Breadcrumb */}
      <div className="container" style={{ paddingTop: "var(--space-lg)", paddingBottom: "var(--space-sm)" }}>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Header catégorie */}
      <div className="container" style={{ paddingBottom: "var(--space-xl)" }}>
        <h1 style={{ marginBottom: "var(--space-sm)" }}>{category.label}</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 600 }}>{category.description}</p>
      </div>

      {/* Marques */}
      {category.brands.length > 0 && (
        <section style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "var(--space-lg) 0", marginBottom: "var(--space-xl)" }}>
          <div className="container">
            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", marginRight: "var(--space-sm)" }}>Marques :</span>
              {category.brands.map((b) => (
                <Link key={b.id} href={`/marques/${b.id}`} className="badge badge-compat" style={{ textDecoration: "none" }}>
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filtres + grille produits */}
      <div className="container" style={{ paddingBottom: "var(--space-3xl)" }}>
        <div style={{ display: "flex", gap: "var(--space-xl)", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 260px", maxWidth: 320 }}>
            <FilterPanel vehicleLabel={vehicle ? `${vehicle.marque} ${vehicle.modele}` : null} />
          </div>

          <div style={{ flex: "3 1 480px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)", gap: "var(--space-md)", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "var(--text-xl)" }}>{total} produit{total !== 1 ? "s" : ""}</h2>
              <SortSelect />
            </div>

            {total === 0 ? (
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
                    compatCodes={parseCompatCodes(p.compatibilite)}
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
    </div>
  );
}
