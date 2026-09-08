import Link from "next/link";
import { getCategories } from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

// Rendu statique : les données changent rarement, on régénère au build (et à la
// demande plus tard). Le HTML complet est servi aux robots, sans JS requis.
export const dynamic = "force-static";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container">
            <h1>Cosmétique &amp; préparation esthétique automobile</h1>
            <p className="hero-sub">
              Comparez les marques recommandées par type de préparation, vérifiez la compatibilité avec votre véhicule,
              et commandez en toute confiance.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2>Nos catégories</h2>
            <p className="section-intro">Choisissez une famille de produits pour découvrir les marques et références.</p>
            <div className="tile-grid">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.id}`} className="tile">
                  <h3>{cat.label}</h3>
                  <p>{cat.description}</p>
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
