import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles, getArticle, articleParagraphs } from "@/lib/blog";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: absoluteUrl(`/blog/${article.slug}`) },
    openGraph: { title: article.title, description: article.excerpt, url: absoluteUrl(`/blog/${article.slug}`), type: "article" },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const paragraphs = articleParagraphs(article.content);

  return (
    <>
      <SiteHeader />
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Guides", href: "/blog" }, { label: article.title }]} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.title,
          description: article.excerpt,
          datePublished: article.publishedAt.toISOString(),
        }}
      />
      <main>
        <section className="section">
          <div className="container">
            <h1>{article.title}</h1>
            <p className="brand-meta">{article.publishedAt.toLocaleDateString("fr-FR")}</p>
            <div className="article-body">
              {/* Texte brut uniquement : chaque paragraphe est un enfant texte React
                  (échappé), jamais du HTML injecté — voir lib/blog.ts. */}
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
