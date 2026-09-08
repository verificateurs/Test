import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVehiclePages, getVehiclePage } from "@/lib/vehicles";
import { getProduct, getMarginPercent } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const pages = await getVehiclePages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getVehiclePage(slug);
  if (!page) return {};
  const title = `Préparation esthétique pour ${page.makeName} ${page.modelName}`;
  const description = `Produits et pièces de préparation esthétique compatibles avec la ${page.makeName} ${page.modelName} : ${page.productIds.length} références sélectionnées.`.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/vehicules/${page.slug}`) },
    openGraph: { title, description, url: absoluteUrl(`/vehicules/${page.slug}`) },
    // Les pages à liste de produits identique à une autre sont dé-indexées pour
    // éviter le contenu dupliqué, tout en restant accessibles à l'internaute.
    robots: page.isDuplicate ? { index: false, follow: true } : undefined,
  };
}

export default async function VehiclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getVehiclePage(slug);
  if (!page) notFound();
  const marginPercent = await getMarginPercent();
  const products = (await Promise.all(page.productIds.map((id) => getProduct(id)))).filter(
    (p): p is NonNullable<typeof p> => p !== null
  );

  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Par véhicule", href: "/vehicules" }, { label: `${page.makeName} ${page.modelName}` }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Préparation esthétique pour ${page.makeName} ${page.modelName}`,
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({
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
            <h1>
              Produits de préparation esthétique pour {page.makeName} {page.modelName}
            </h1>
            <p className="hero-sub">
              Sélection de pièces compatibles avec les motorisations {page.motorisations.map((m) => m.label).join(", ")}.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>{products.length} produits compatibles</h2>
            <div className="tile-grid">
              {products.map((product) => (
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
