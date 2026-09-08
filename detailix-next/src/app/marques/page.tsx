import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { starString } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Toutes les marques",
  description: "Toutes les marques de cosmétique et de préparation esthétique automobile référencées chez Detailix.",
  alternates: { canonical: absoluteUrl("/marques") },
};

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Marques" }]} />
      <main>
        <section className="section">
          <div className="container">
            <h1>Marques ({brands.length})</h1>
            <p className="section-intro">Toutes les marques référencées, toutes catégories confondues.</p>
            <div className="tile-grid">
              {brands.map((brand) => (
                <Link key={brand.id} href={`/marques/${brand.id}`} className="tile">
                  <h3>
                    {brand.name} {brand.recommended && <span className="badge">Recommandé</span>}
                  </h3>
                  <div className="brand-meta">
                    {brand.origine} · {brand.gamme} · {brand.category.label}
                  </div>
                  <div className="rating-row">
                    <span className="stars" aria-hidden="true">
                      {starString(brand.rating)}
                    </span>
                    <span className="rating-value">{brand.rating.toFixed(1)}</span>
                    <span className="review-count">({brand.reviewCount} avis)</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
