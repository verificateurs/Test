import type { Metadata } from "next";
import Link from "next/link";
import { getVehiclePages } from "@/lib/vehicles";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Produits par véhicule",
  description: "Trouvez les produits de préparation esthétique compatibles avec votre véhicule, par marque et modèle.",
  alternates: { canonical: absoluteUrl("/vehicules") },
};

export default async function VehiclesPage() {
  const pages = await getVehiclePages();
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Par véhicule" }]} />
      <main>
        <section className="section">
          <div className="container">
            <h1>Produits par véhicule</h1>
            <p className="section-intro">
              Sélectionnez votre modèle pour ne voir que les pièces de préparation esthétique compatibles.
            </p>
            <div className="tile-grid">
              {pages.map((page) => (
                <Link key={page.slug} href={`/vehicules/${page.slug}`} className="tile">
                  <h3>
                    {page.makeName} {page.modelName}
                  </h3>
                  <p>{page.productIds.length} produits compatibles</p>
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
