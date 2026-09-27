import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de Detailix : données collectées, finalités, droits RGPD et cookies.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <div className="container legal-page">
      <h1>Politique de confidentialité</h1>

      <section>
        <h2>Données collectées</h2>
        <p>
          [À COMPLÉTER : liste des données personnelles collectées via le compte, la commande et le
          sélecteur de véhicule (garage)]
        </p>
      </section>

      <section>
        <h2>Finalités du traitement</h2>
        <p>
          [À COMPLÉTER : finalités des traitements — gestion des commandes, du compte client, sécurité du
          site, etc.]
        </p>
      </section>

      <section>
        <h2>Droits RGPD</h2>
        <p>
          Conformément au Règlement général sur la protection des données (RGPD), vous disposez d&apos;un
          droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
          portabilité de vos données personnelles. Pour exercer ces droits, contactez :{" "}
          [À COMPLÉTER : adresse email dédiée aux demandes RGPD]
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          [À COMPLÉTER : liste des cookies utilisés (session, panier, véhicule sélectionné, préférences
          CSRF) et leur durée de conservation]
        </p>
      </section>
    </div>
  );
}
