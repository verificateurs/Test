import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function ComptePage() {
  const user = await requireUser("/compte");
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Bonjour, {user.displayName}</h1>
            <p className="section-intro">{user.email}</p>
            <div className="tile-grid">
              <a href="/compte/commandes" className="tile">
                <h3>Mes commandes</h3>
                <p>Historique et suivi de vos commandes.</p>
              </a>
              <a href="/compte/liste-envies" className="tile">
                <h3>Ma liste d&apos;envies</h3>
                <p>Les produits que vous avez enregistrés.</p>
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
