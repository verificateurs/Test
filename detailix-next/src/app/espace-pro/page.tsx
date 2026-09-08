import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Espace professionnel",
  description: "Tarifs préférentiels pour les garages, détailers et préparateurs professionnels.",
};

export default async function EspaceProPage() {
  const setting = await prisma.setting.findUnique({ where: { key: "proDiscountPercent" } });
  const discount = Number(setting?.value ?? 0);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container">
            <h1>Espace professionnel</h1>
            <p className="section-intro">
              Garages, centres de préparation esthétique, détailers indépendants : bénéficiez d&apos;une remise
              automatique de {discount}% sur l&apos;ensemble du catalogue, appliquée directement à la validation de
              votre commande — aucun code à saisir.
            </p>
            <div className="admin-card">
              <h2>Comment ça marche</h2>
              <ol>
                <li>Créez un compte client (gratuit, sans engagement).</li>
                <li>Contactez-nous avec un justificatif professionnel (Kbis, carte artisan…) pour activer votre compte.</li>
                <li>Une fois activé, la remise s&apos;applique automatiquement à chaque commande, sans code promo.</li>
              </ol>
              <p className="form-hint">
                La remise n&apos;apparaît pas sur les fiches produit (identiques pour tous les visiteurs pour des
                raisons de référencement) : elle est calculée à la validation de votre panier, une fois connecté.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
