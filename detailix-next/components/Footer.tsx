import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

// Mirrors the trust items shown on the homepage (app/page.tsx) — kept in sync
// manually since app/page.tsx is outside this task's scope.
const TRUST_ITEMS = [
  { icon: "/icons/icon-lock.svg", title: "Paiement sécurisé" },
  { icon: "/icons/icon-truck.svg", title: "Livraison rapide" },
  { icon: "/icons/icon-return.svg", title: "Retours 30 jours" },
  { icon: "/icons/icon-trophy.svg", title: "Marques premium" },
];

export async function Footer() {
  const categories = await db.category.findMany({
    select: { id: true, label: true },
    orderBy: { id: "asc" },
  });

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <div className="footer-trust">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="footer-trust-item">
                <Image src={item.icon} alt="" width={18} height={18} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Catégories</h3>
          <ul className="footer-links">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/categories/${cat.id}`}>{cat.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h3 className="footer-heading">Informations légales</h3>
          <ul className="footer-links">
            <li><Link href="/mentions-legales">Mentions légales</Link></li>
            <li><Link href="/cgv">Conditions générales de vente</Link></li>
            <li><Link href="/confidentialite">Politique de confidentialité</Link></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Detailix. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
