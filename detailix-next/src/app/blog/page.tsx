import type { Metadata } from "next";
import Link from "next/link";
import { getArticles } from "@/lib/blog";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Guides et conseils",
  description: "Guides d'entretien, de préparation esthétique et de choix de produits.",
  alternates: { canonical: absoluteUrl("/blog") },
};

export default async function BlogPage() {
  const articles = await getArticles();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Guides et conseils</h1>
            {articles.length === 0 ? (
              <p className="section-intro">Aucun guide publié pour l&apos;instant.</p>
            ) : (
              <div className="tile-grid">
                {articles.map((article) => (
                  <Link key={article.id} href={`/blog/${article.slug}`} className="tile">
                    <h3>{article.title}</h3>
                    <p>{article.excerpt}</p>
                  </Link>
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
