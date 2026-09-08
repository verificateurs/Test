import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReseaux, getCentre } from "@/lib/preparateurs";
import { starString } from "@/lib/catalogue";
import { SiteHeader, SiteFooter, Breadcrumb } from "@/components/SiteChrome";
import { JsonLd } from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export function generateStaticParams() {
  return getReseaux().flatMap((reseau) => reseau.centres.map((centre) => ({ centreId: centre.id })));
}

export function generateMetadata({ params }: { params: Promise<{ centreId: string }> }): Promise<Metadata> {
  return params.then(({ centreId }) => {
    const found = getCentre(centreId);
    if (!found) return {};
    const { centre, reseau } = found;
    const title = `${reseau.name} ${centre.ville}`;
    const description = `${reseau.name} à ${centre.ville} — ${reseau.specialite}. Note ${centre.rating.toFixed(1)}/5 (${centre.reviewCount} avis).`;
    return {
      title,
      description,
      alternates: { canonical: absoluteUrl(`/preparateurs/${centre.id}`) },
      openGraph: { title, description, url: absoluteUrl(`/preparateurs/${centre.id}`) },
    };
  });
}

export default async function CentrePage({ params }: { params: Promise<{ centreId: string }> }) {
  const { centreId } = await params;
  const found = getCentre(centreId);
  if (!found) notFound();
  const { centre, reseau } = found;

  return (
    <>
      <SiteHeader />
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Préparateurs", href: "/preparateurs" },
          { label: `${reseau.name} ${centre.ville}` },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: `${reseau.name} ${centre.ville}`,
          description: reseau.description,
        }}
      />
      <main>
        <section className="hero">
          <div className="container">
            <p className="product-detail-brand">{reseau.name}</p>
            <h1>
              {reseau.name} — {centre.ville}
            </h1>
            <div className="brand-meta">{reseau.specialite}</div>
            <div className="rating-row">
              <span className="stars" aria-hidden="true">
                {starString(centre.rating)}
              </span>
              <span className="rating-value">{centre.rating.toFixed(1)}</span>
              <span className="review-count">({centre.reviewCount} avis)</span>
            </div>
            <p className="preference">{reseau.description}</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {centre.reviews.length > 0 && (
              <div className="reviews">
                <h2>Avis clients</h2>
                {centre.reviews.map((r, i) => (
                  <div key={i} className="review">
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
