import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Préparateurs partenaires",
  description: "Shiftech, BR Performance et leurs centres partenaires — bientôt disponible.",
  robots: { index: false, follow: true },
};

export default function PreparateursPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Préparateurs partenaires</h1>
            <p className="section-intro">
              Les fiches Shiftech, BR Performance et leurs centres par ville arrivent bientôt, avec les avis par
              centre. Cette page est en cours de construction.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
