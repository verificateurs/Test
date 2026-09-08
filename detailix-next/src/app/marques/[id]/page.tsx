import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBrand, getMarginPercent, starString } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const brands = await prisma.brand.findMany({ select: { id: true } });
  return brands.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) return {};
  const title = `${brand.name} — ${brand.category.label}`;
  const description = `${brand.name} (${brand.origine}, ${brand.gamme}) : ${brand.preference}`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/marques/${brand.id}`) },
    openGraph: { title, description, url: absoluteUrl(`/marques/${brand.id}`) },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();
  const marginPercent = await getMarginPercent();

  return (
    <>
      <SiteHeader />
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: brand.category.label, href: `/categories/${brand.category.id}` },
          { label: brand.name },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: brand.name,
          description: brand.preference,
        }}
      />
      <main>
        <section className="hero">
          <div className="container">
            <p className="product-detail-brand">{brand.category.label}</p>
            <h1>
              {brand.name} {brand.recommended && <span className="badge">Recommandé</span>}
            </h1>
            <div className="brand-meta">
              {brand.origine} · {brand.gamme}
            </div>
            <div className="rating-row">
              <span className="stars" aria-hidden="true">
                {starString(brand.rating)}
              </span>
              <span className="rating-value">{brand.rating.toFixed(1)}</span>
              <span className="review-count">({brand.reviewCount} avis)</span>
            </div>
            <p className="preference">{brand.preference}</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Produits {brand.name} ({brand.products.length})</h2>
            <div className="tile-grid">
              {brand.products.map((product) => (
                <ProductCard key={product.id} product={product} marginPercent={marginPercent} />
              ))}
            </div>

            {brand.reviews.length > 0 && (
              <div className="reviews">
                <h2>Avis clients</h2>
                {brand.reviews.map((r) => (
                  <div key={r.id} className="review">
                    <div className="review-head">
                      <strong>{r.author}</strong>
                      <span className="stars" aria-hidden="true">
                        {starString(r.rating)}
                      </span>
                      <span className="review-date">{r.date}</span>
                    </div>
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
