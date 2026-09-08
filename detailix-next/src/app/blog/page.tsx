import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Guides et conseils",
  description: "Guides d'entretien, de préparation esthétique et de choix de produits — bientôt disponible.",
  robots: { index: false, follow: true },
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Guides et conseils</h1>
            <p className="section-intro">
              Nos guides d&apos;entretien et de préparation esthétique arrivent bientôt. Cette page est en cours de
              construction.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
