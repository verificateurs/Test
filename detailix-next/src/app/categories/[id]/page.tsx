import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getCategoryWithBrands, getMarginPercent, starString } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cat = await getCategoryWithBrands(id);
  if (!cat) return {};
  const title = cat.label;
  const description = `${cat.description} ${cat.brands.length} marques, ${cat.products.length} produits disponibles chez Detailix.`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/categories/${cat.id}`) },
    openGraph: { title, description, url: absoluteUrl(`/categories/${cat.id}`) },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await getCategoryWithBrands(id);
  if (!cat) notFound();
  const marginPercent = await getMarginPercent();

  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Catégories", href: "/categories" }, { label: cat.label }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Catégories", item: absoluteUrl("/categories") },
            { "@type": "ListItem", position: 3, name: cat.label, item: absoluteUrl(`/categories/${cat.id}`) },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: cat.label,
          numberOfItems: cat.products.length,
          itemListElement: cat.products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/produits/${p.id}`),
            name: p.name,
          })),
        }}
      />
      <main>
        <section className="hero">
          <div className="container">
            <h1>{cat.label}</h1>
            <p className="hero-sub">{cat.description}</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Marques ({cat.brands.length})</h2>
            <p className="section-intro">Notre sélection de marques pour cette catégorie.</p>
            <div className="tile-grid">
              {cat.brands.map((brand) => (
                <Link key={brand.id} href={`/marques/${brand.id}`} className="tile">
                  <h3>
                    {brand.name} {brand.recommended && <span className="badge">Recommandé</span>}
                  </h3>
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
                  <p>{brand.preference}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Produits ({cat.products.length})</h2>
            <div className="tile-grid">
              {cat.products.map((product) => (
                <ProductCard key={product.id} product={product} marginPercent={marginPercent} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
