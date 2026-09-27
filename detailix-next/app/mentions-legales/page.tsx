import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Detailix : éditeur du site, hébergeur et propriété intellectuelle.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <div className="container legal-page">
      <h1>Mentions légales</h1>

      <section>
        <h2>Éditeur du site</h2>
        <p>
          Raison sociale : [À COMPLÉTER : raison sociale]<br />
          Forme juridique : [À COMPLÉTER : forme juridique]<br />
          Capital social : [À COMPLÉTER : capital social]<br />
          Siège social : [À COMPLÉTER : adresse du siège social]<br />
          SIRET : [À COMPLÉTER : numéro SIRET]<br />
          RCS : [À COMPLÉTER : ville et numéro RCS]<br />
          Numéro de TVA intracommunautaire : [À COMPLÉTER : numéro de TVA]<br />
          Directeur de la publication : [À COMPLÉTER : nom du responsable de publication]<br />
          Contact : [À COMPLÉTER : adresse email de contact]
        </p>
      </section>

      <section>
        <h2>Hébergeur</h2>
        <p>
          Raison sociale : [À COMPLÉTER : nom de l&apos;hébergeur]<br />
          Adresse : [À COMPLÉTER : adresse de l&apos;hébergeur]<br />
          Contact : [À COMPLÉTER : contact de l&apos;hébergeur]
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, images, logos, structure) est protégé
          par le droit de la propriété intellectuelle. Toute reproduction, représentation ou exploitation,
          totale ou partielle, sans autorisation préalable, est interdite.
        </p>
        <p>
          Les marques et produits présentés sur ce site appartiennent à leurs propriétaires respectifs et
          sont cités à titre informatif dans le cadre de leur commercialisation.
        </p>
      </section>
    </div>
  );
}
