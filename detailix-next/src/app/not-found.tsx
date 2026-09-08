import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Page introuvable</h1>
            <p className="section-intro">La page demandée n&apos;existe pas ou a été déplacée.</p>
            <Link href="/" className="btn-primary">Retour à l&apos;accueil</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
