export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";

export default async function HomePage() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true, brands: true } },
    },
    orderBy: { id: "asc" },
  });

  const ICONS: Record<string, string> = {
    "cosmetique-carrosserie": "🧴",
    "polish-protection-ceramique": "✨",
    "jantes-pneus": "🔩",
    "kits-carrosserie": "🏎️",
    "eclairage": "💡",
    "echappement-sport": "🔊",
    "covering-vitres-teintees": "🎨",
    "preparation-moteur": "⚡",
    "outils-detailing": "🔧",
  };

  return (
    <>
      {/* Hero */}
      <section style={{
        background: "linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg) 100%)",
        borderBottom: "1px solid var(--border)",
        padding: "var(--space-3xl) 0",
      }}>
        <div className="container" style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", marginBottom: "var(--space-md)", letterSpacing: "-0.03em" }}>
            La préparation auto,<br />
            <span style={{ color: "var(--accent)" }}>sans compromis.</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-lg)", maxWidth: 520, margin: "0 auto var(--space-xl)" }}>
            Cosmétique, préparation moteur, carrosserie, jantes — les meilleures marques mondiales avec filtrage par code moteur.
          </p>
          <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/categories/preparation-moteur" className="btn btn-primary">
              Découvrir la préparation moteur
            </Link>
            <Link href="/preparateurs" className="btn btn-ghost">
              Trouver un préparateur
            </Link>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section style={{ padding: "var(--space-3xl) 0" }}>
        <div className="container">
          <h2 style={{ marginBottom: "var(--space-xl)", fontSize: "var(--text-2xl)" }}>
            Toutes les catégories
          </h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="tile reveal"
                style={{ padding: "var(--space-lg)", display: "block" }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "var(--space-sm)" }}>
                  {ICONS[cat.id] ?? "📦"}
                </div>
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 700, marginBottom: "var(--space-xs)" }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {cat._count.brands} marques · {cat._count.products} produits
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "var(--space-xl) 0",
      }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-lg)", textAlign: "center" }}>
            {[
              { icon: "🔒", title: "Paiement sécurisé", desc: "SSL · 3D Secure" },
              { icon: "📦", title: "Livraison rapide", desc: "48h à 5 jours" },
              { icon: "↩️", title: "Retours 30 jours", desc: "Satisfait ou remboursé" },
              { icon: "🏆", title: "Marques premium", desc: "60 marques sélectionnées" },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ fontSize: "1.8rem", marginBottom: "var(--space-xs)" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
