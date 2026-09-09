import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/confidentialite") },
};

// Décrit précisément ce que l'application collecte réellement (voir
// prisma/schema.prisma) — pas un texte générique. À mettre à jour si le
// modèle de données change (ex. Phase 3 : jeton de réinitialisation de mot
// de passe ; Phase 8 : analytique).
export default function ConfidentialitePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container article-body">
            <h1>Politique de confidentialité</h1>

            <h2>Ce que nous collectons</h2>
            <p>
              <strong>Compte client</strong> (si vous créez un compte) : adresse email, nom affiché, mot de passe —
              jamais stocké en clair, uniquement sous forme hachée (scrypt) et impossible à retrouver.
            </p>
            <p>
              <strong>Commande</strong> : email, nom et adresse de livraison, contenu et montant de la commande.
              Une commande peut être passée sans compte ; dans ce cas, elle n&apos;est reliée à aucun profil.
            </p>
            <p>
              <strong>Connexion</strong> : un cookie de session, strictement nécessaire au fonctionnement du site
              (rester connecté), supprimé à la déconnexion ou à expiration. Aucun cookie publicitaire ou de
              suivi n&apos;est déposé.
            </p>
            <p>
              <strong>Panier, garage, comparateur, liste d&apos;envies récente</strong> : conservés dans le
              stockage local de votre navigateur (localStorage), jamais transmis à nos serveurs tant que vous ne
              validez pas une commande. Les supprimer revient à vider les données de site de votre navigateur pour
              ce domaine.
            </p>

            <h2>Ce que nous ne collectons pas</h2>
            <p>
              Aucune donnée de carte bancaire ne transite par nos serveurs : le paiement, lorsqu&apos;il est actif,
              est traité directement par Stripe sur une page hébergée par Stripe. Aucun outil d&apos;analytique ou
              de mesure d&apos;audience n&apos;est actif à ce jour.
            </p>

            <h2>Destinataires</h2>
            <p>
              Vos données de commande sont transmises à Stripe (paiement, lorsqu&apos;il est configuré) et à Resend
              (envoi de l&apos;email de confirmation de commande). Aucune autre transmission à un tiers.
            </p>

            <h2>Durée de conservation</h2>
            <p>
              Les données de compte sont conservées tant que le compte existe. Les données de commande sont
              conservées pour la durée nécessaire au traitement de la commande et aux obligations comptables
              applicables.
            </p>

            <h2>Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression
              de vos données. Pour l&apos;exercer, contactez-nous à [email de contact].
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
