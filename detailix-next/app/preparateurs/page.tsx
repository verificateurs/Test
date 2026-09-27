export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { getPreparateurCentres } from "@/lib/preparateurs";
import { DEPARTEMENTS_FRANCE } from "@/lib/departements-france";
import { PreparateurSearch } from "@/components/preparateurs/PreparateurSearch";

export const metadata: Metadata = {
  title: "Préparateurs & Partenaires",
  description: "Trouvez un préparateur automobile partenaire près de chez vous. Recherchez par département, jusqu'à 200 km, avec avis, coordonnées et tarifs professionnels.",
};

export default function PreparateursPage() {
  const centres = getPreparateurCentres();

  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: "var(--space-3xl) 0" }}>
        <div className="container" style={{ maxWidth: 720, textAlign: "center" }}>
          <h1 style={{ marginBottom: "var(--space-md)" }}>Réseau Préparateurs Detailix</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-lg)", lineHeight: 1.7 }}>
            Nos préparateurs partenaires certifiés utilisent nos produits et bénéficient de tarifs PRO.
            Trouvez l&apos;expert le plus proche pour donner vie à votre build.
          </p>
          <div style={{ marginTop: "var(--space-xl)" }}>
            <Link href="/inscription" className="btn btn-primary">
              Devenir préparateur partenaire
            </Link>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="container" style={{ paddingTop: "var(--space-3xl)", paddingBottom: "var(--space-3xl)" }}>
        <PreparateurSearch centres={centres} departements={DEPARTEMENTS_FRANCE} />

        {/* CTA espace PRO */}
        <div style={{ marginTop: "var(--space-3xl)", textAlign: "center", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "var(--space-3xl)", border: "1px solid var(--border)" }}>
          <h2 style={{ marginBottom: "var(--space-md)" }}>Vous êtes professionnel ?</h2>
          <p style={{ color: "var(--text-muted)", maxWidth: 520, margin: "0 auto var(--space-xl)" }}>
            Accédez à notre espace PRO : tarifs dégressifs, commandes en volume, catalogue étendu et support dédié.
          </p>
          <Link href="/inscription" className="btn btn-primary">Créer un compte PRO</Link>
        </div>
      </div>
    </div>
  );
}
