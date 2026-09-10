import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Préparateurs & Partenaires",
  description: "Découvrez notre réseau de préparateurs automobiles partenaires. Expertise, certification et tarifs professionnels pour les pros du tuning.",
};

const PREPARATEURS = [
  {
    name: "GTI Performance Bordeaux",
    ville: "Bordeaux",
    specialite: "Reprogrammation ECU, stage turbo",
    marques: ["Volkswagen", "Audi", "Seat", "Skoda"],
    rating: 4.9,
    contact: "gti-perf.fr",
  },
  {
    name: "Motorsport Lyon",
    ville: "Lyon",
    specialite: "Préparation moteur, swap & compétition",
    marques: ["BMW", "Mercedes", "Porsche"],
    rating: 4.8,
    contact: "motorsport-lyon.fr",
  },
  {
    name: "JDM Factory Paris",
    ville: "Paris (93)",
    specialite: "Tuning JDM, widebody, jantes",
    marques: ["Honda", "Toyota", "Subaru", "Nissan"],
    rating: 4.7,
    contact: "jdmfactory.fr",
  },
  {
    name: "Detail Pro Marseille",
    ville: "Marseille",
    specialite: "Detailing haut de gamme, PPF, coating",
    marques: ["Universel"],
    rating: 4.9,
    contact: "detailpro-marseille.fr",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: "var(--star)" }} aria-label={`Note ${rating}/5`}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}

export default function PreparateursPage() {
  return (
    <div className="page-enter">
      {/* Hero */}
      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: "var(--space-3xl) 0" }}>
        <div className="container" style={{ maxWidth: 720, textAlign: "center" }}>
          <h1 style={{ marginBottom: "var(--space-md)" }}>Réseau Préparateurs Detailix</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-lg)", lineHeight: 1.7 }}>
            Nos préparateurs partenaires certifiés utilisent nos produits et bénéficient de tarifs PRO.
            Trouvez l'expert le plus proche pour donner vie à votre build.
          </p>
          <div style={{ marginTop: "var(--space-xl)" }}>
            <Link href="/inscription" className="btn btn-primary">
              Devenir préparateur partenaire
            </Link>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="container" style={{ paddingTop: "var(--space-3xl)", paddingBottom: "var(--space-3xl)" }}>
        <div style={{ display: "grid", gap: "var(--space-lg)", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {PREPARATEURS.map((p) => (
            <div key={p.name} className="tile reveal" style={{ padding: "var(--space-xl)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-md)" }}>
                <h2 style={{ fontSize: "var(--text-lg)", margin: 0 }}>{p.name}</h2>
                <span className="badge badge-compat">{p.ville}</span>
              </div>
              <Stars rating={p.rating} />
              <span style={{ marginLeft: 8, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{p.rating}/5</span>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", margin: "var(--space-md) 0" }}>
                {p.specialite}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginBottom: "var(--space-md)" }}>
                {p.marques.map((m) => (
                  <span key={m} className="badge" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: "var(--text-xs)" }}>
                    {m}
                  </span>
                ))}
              </div>
              <a
                href={`https://${p.contact}`}
                rel="noopener noreferrer"
                target="_blank"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: "var(--text-xs)" }}
              >
                {p.contact} →
              </a>
            </div>
          ))}
        </div>

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
