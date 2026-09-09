import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/mentions-legales") },
};

// Identité légale à compléter avant mise en production — voir la checklist
// de lancement dans le README. Ces champs ne peuvent pas être devinés :
// ils dépendent de la structure juridique réelle de l'exploitant du site.
export default function MentionsLegalesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container article-body">
            <h1>Mentions légales</h1>

            <h2>Éditeur du site</h2>
            <p>
              [Raison sociale] — [forme juridique], au capital de [montant] € — RCS [ville] [numéro SIREN] — SIRET
              [numéro SIRET] — Siège social : [adresse complète] — TVA intracommunautaire : [numéro].
            </p>
            <p>Directeur de la publication : [nom, fonction] — Contact : [email de contact].</p>

            <h2>Hébergement</h2>
            <p>[Nom de l'hébergeur] — [adresse] — [contact/téléphone].</p>

            <h2>Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des contenus présents sur ce site (textes, visuels, structure) est protégé par le droit
              de la propriété intellectuelle. Toute reproduction, même partielle, sans autorisation préalable est
              interdite.
            </p>

            <h2>Données personnelles</h2>
            <p>
              Le traitement des données personnelles collectées via ce site est détaillé dans notre{" "}
              <a href="/confidentialite">politique de confidentialité</a>.
            </p>

            <h2>Médiation de la consommation</h2>
            <p>
              Conformément à l&apos;article L. 616-1 du Code de la consommation, le client a la possibilité de
              recourir gratuitement au service de médiation [nom du médiateur, coordonnées] en cas de litige.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
