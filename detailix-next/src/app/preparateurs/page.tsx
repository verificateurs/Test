import type { Metadata } from "next";
import Link from "next/link";
import { getReseaux, type Centre } from "@/lib/preparateurs";
import { starString } from "@/lib/catalogue";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Préparateurs partenaires",
  description: "Shiftech, BR Performance et leurs centres partenaires par ville — reprogrammation, échappements sport, préparation moteur.",
  alternates: { canonical: absoluteUrl("/preparateurs") },
};

function CentreCard({ reseauId, centre }: { reseauId: string; centre: Centre }) {
  return (
    <Link href={`/preparateurs/${centre.id}`} className="tile">
      <h3>{centre.ville}</h3>
      <div className="rating-row">
        <span className="stars" aria-hidden="true">
          {starString(centre.rating)}
        </span>
        <span className="rating-value">{centre.rating.toFixed(1)}</span>
        <span className="review-count">({centre.reviewCount} avis)</span>
      </div>
    </Link>
  );
}

export default function PreparateursPage() {
  const reseaux = getReseaux();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Préparateurs partenaires</h1>
            <p className="section-intro">
              Nos réseaux partenaires pour la reprogrammation moteur, les échappements sport et la préparation, avec
              leurs centres par ville.
            </p>

            {reseaux.map((reseau) => (
              <div key={reseau.id} className="reviews">
                <h2>{reseau.name}</h2>
                <p className="preference">
                  {reseau.specialite} — {reseau.description}
                </p>
                <div className="tile-grid">
                  {reseau.centres.map((centre) => (
                    <CentreCard key={centre.id} reseauId={reseau.id} centre={centre} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
