import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Toutes les catégories de produits",
  description:
    "Parcourez toutes les familles de cosmétique et de préparation esthétique automobile : entretien, protection céramique, jantes, kits carrosserie, éclairage, échappement et plus.",
  alternates: { canonical: absoluteUrl("/categories") },
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Catégories" }]} />
      <main>
        <section className="section">
          <div className="container">
            <h1>Catégories de produits</h1>
            <p className="section-intro">{categories.length} familles de produits pour l&apos;entretien et la préparation esthétique.</p>
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
