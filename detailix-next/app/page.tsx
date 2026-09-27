export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export default async function HomePage() {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true, brands: true } },
    },
    orderBy: { id: "asc" },
  });

  const ICONS: Record<string, string> = {
    "cosmetique-carrosserie": "/icons/icon-cosmetique-carrosserie.svg",
    "polish-protection-ceramique": "/icons/icon-polish-protection-ceramique.svg",
    "jantes-pneus": "/icons/icon-jantes-pneus.svg",
    "kits-carrosserie": "/icons/icon-kits-carrosserie.svg",
    "eclairage": "/icons/icon-eclairage.svg",
    "echappement-sport": "/icons/icon-echappement-sport.svg",
    "covering-vitres-teintees": "/icons/icon-covering-vitres-teintees.svg",
    "preparation-moteur": "/icons/icon-preparation-moteur.svg",
    "outils-detailing": "/icons/icon-outils-detailing.svg",
  };

  const TRUST_ITEMS = [
    { icon: "/icons/icon-lock.svg", title: "Paiement sécurisé", desc: "SSL · 3D Secure" },
    { icon: "/icons/icon-truck.svg", title: "Livraison rapide", desc: "48h à 5 jours" },
    { icon: "/icons/icon-return.svg", title: "Retours 30 jours", desc: "Satisfait ou remboursé" },
    { icon: "/icons/icon-trophy.svg", title: "Marques premium", desc: "60 marques sélectionnées" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="hero-section carbon-texture">
        <div className="container">
          <h1 className="hero-title reveal reveal--hero">
            La préparation auto,<br />
            <span className="accent">sans compromis.</span>
          </h1>
          <p className="hero-lead reveal reveal--hero">
            Cosmétique, préparation moteur, carrosserie, jantes — les meilleures marques mondiales avec filtrage par code moteur.
          </p>
          <div className="hero-actions reveal reveal--hero">
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
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Toutes les catégories</h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.id}`}
                className="tile reveal category-tile"
              >
                <div className="category-tile-icon">
                  <Image
                    src={ICONS[cat.id] ?? "/icons/icon-default.svg"}
                    alt=""
                    width={28}
                    height={28}
                  />
                </div>
                <div className="category-tile-label">{cat.label}</div>
                <div className="category-tile-meta">
                  {cat._count.brands} marques · {cat._count.products} produits
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-grid">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="reveal">
                <div className="trust-icon">
                  <Image src={item.icon} alt="" width={26} height={26} />
                </div>
                <div className="trust-item-title">{item.title}</div>
                <div className="trust-item-desc">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
