export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
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
import { GarageSelector } from "@/components/garage/GarageSelector";
import { CATEGORY_CONTENT } from "@/lib/category-content";
import type { Metadata } from "next";

const HOMOLOGATION_LABELS: Record<string, string> = {
  route_ouverte: "Route ouverte",
  usage_piste: "Usage piste uniquement",
  non_applicable: "Non applicable",
};

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
    vehiclePlatform: vehicle?.platform,
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

  const stagePacks =
    id === "preparation-moteur" && vehicle
      ? await db.stagePack.findMany({ where: { codeMoteur: vehicle.codeMoteur }, orderBy: { stage: "asc" } })
      : [];

  const recommendedBrands = category.brands.filter((b) => b.recommended).slice(0, 4);

  const content = CATEGORY_CONTENT[category.id];

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
        {content ? (
          <>
            <p style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-sm)", maxWidth: 720 }}>{content.tagline}</p>
            <p style={{ color: "var(--text-muted)", maxWidth: 720 }}>{content.intro}</p>
          </>
        ) : (
          <p style={{ color: "var(--text-muted)", maxWidth: 600 }}>{category.description}</p>
        )}
      </div>

      {/* Packs de préparation moteur */}
      {id === "preparation-moteur" && (
        <section className="stage-packs-section">
          <div className="container">
            {vehicle ? (
              stagePacks.length > 0 ? (
                <>
                  <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-xs)" }}>
                    Packs de préparation disponibles pour votre véhicule
                  </h2>
                  <p style={{ color: "var(--text-muted)", marginBottom: "var(--space-lg)" }}>
                    Pour {vehicle.marque} {vehicle.modele} — {vehicle.motorisation}.
                  </p>
                  <div className="stage-pack-grid">
                    {stagePacks.map((pack) => (
                      <div key={pack.id} className="stage-pack-card">
                        <div className="stage-pack-badge">Stage {pack.stage}</div>
                        <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-sm)" }}>{pack.label}</h3>
                        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-md)" }}>
                          {pack.description}
                        </p>
                        <div className="stage-pack-stats">
                          <div>
                            <span className="stage-pack-stat-label">Gain puissance</span>
                            <span className="stage-pack-stat-value">+{pack.gainChMin} à +{pack.gainChMax} ch</span>
                          </div>
                          <div>
                            <span className="stage-pack-stat-label">Gain couple</span>
                            <span className="stage-pack-stat-value">+{pack.gainNmMin} à +{pack.gainNmMax} Nm</span>
                          </div>
                          <div>
                            <span className="stage-pack-stat-label">Prix indicatif</span>
                            <span className="stage-pack-stat-value">
                              {pack.prixIndicatif.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                        </div>
                        <div className="stage-pack-homologation">
                          Homologation : <strong>{HOMOLOGATION_LABELS[pack.homologation] ?? pack.homologation}</strong>
                        </div>
                        <p className="stage-pack-disclaimer">
                          Gains indicatifs, à confirmer sur banc selon l&rsquo;état du véhicule.
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="stage-pack-empty">
                  Aucun pack de préparation référencé pour {vehicle.marque} {vehicle.modele} ({vehicle.motorisation}) pour le moment.
                </div>
              )
            ) : (
              <div className="stage-pack-empty">
                <p style={{ marginBottom: "var(--space-md)" }}>
                  Sélectionnez votre véhicule pour voir les packs de préparation moteur (Stage 1/2/3) disponibles pour votre motorisation, avec leurs gains indicatifs et leur statut d&rsquo;homologation.
                </p>
                <GarageSelector />
              </div>
            )}
          </div>

          <style>{`
            .stage-packs-section {
              background: var(--bg-elevated);
              border-top: 1px solid var(--border);
              border-bottom: 1px solid var(--border);
              padding: var(--space-xl) 0;
              margin-bottom: var(--space-xl);
            }
            .stage-pack-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: var(--space-lg);
            }
            .stage-pack-card {
              background: var(--bg-card);
              border: 1px solid var(--border);
              border-radius: var(--radius);
              padding: var(--space-lg);
              position: relative;
            }
            .stage-pack-badge {
              display: inline-block;
              background: var(--accent-soft);
              color: var(--accent);
              font-size: var(--text-xs);
              font-weight: 700;
              padding: var(--space-xs) var(--space-sm);
              border-radius: var(--radius-sm);
              margin-bottom: var(--space-sm);
            }
            .stage-pack-stats {
              display: flex;
              flex-direction: column;
              gap: var(--space-xs);
              margin-bottom: var(--space-md);
              padding: var(--space-sm) 0;
              border-top: 1px solid var(--border);
              border-bottom: 1px solid var(--border);
            }
            .stage-pack-stats > div {
              display: flex;
              justify-content: space-between;
              font-size: var(--text-sm);
            }
            .stage-pack-stat-label {
              color: var(--text-muted);
            }
            .stage-pack-stat-value {
              font-weight: 600;
            }
            .stage-pack-homologation {
              font-size: var(--text-sm);
              color: var(--text-muted);
              margin-bottom: var(--space-sm);
            }
            .stage-pack-disclaimer {
              font-size: var(--text-xs);
              color: var(--text-muted);
              margin: 0;
            }
            .stage-pack-empty {
              color: var(--text-muted);
            }
          `}</style>
        </section>
      )}

      {/* Marques recommandées */}
      {recommendedBrands.length > 0 && (
        <section className="recommended-brands-section">
          <div className="container">
            <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-lg)" }}>Marques recommandées</h2>
            <div className="recommended-brands-grid">
              {recommendedBrands.map((b) => (
                <Link key={b.id} href={`/marques/${b.id}`} className="recommended-brand-card">
                  <div className="recommended-brand-name">{b.name}</div>
                  <div className="recommended-brand-meta">
                    {b.origine} · {b.gamme}
                  </div>
                  <div className="recommended-brand-rating">
                    ★ {b.rating.toFixed(1)} ({b.reviewCount} avis)
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <style>{`
            .recommended-brands-section {
              margin-bottom: var(--space-xl);
            }
            .recommended-brands-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
              gap: var(--space-md);
            }
            .recommended-brand-card {
              background: var(--bg-card);
              border: 1px solid var(--border);
              border-radius: var(--radius);
              padding: var(--space-lg);
              text-decoration: none;
              color: var(--text);
              transition: border-color 0.2s var(--ease), transform 0.2s var(--ease);
            }
            .recommended-brand-card:hover {
              border-color: var(--accent);
              transform: translateY(-2px);
            }
            .recommended-brand-name {
              font-weight: 700;
              margin-bottom: var(--space-xs);
            }
            .recommended-brand-meta {
              font-size: var(--text-sm);
              color: var(--text-muted);
              margin-bottom: var(--space-sm);
            }
            .recommended-brand-rating {
              font-size: var(--text-sm);
              color: var(--star);
            }
          `}</style>
        </section>
      )}

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
    </div>
  );
}
