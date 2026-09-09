import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoFactorForm } from "./TwoFactorForm";
import { getPendingTwoFactor } from "@/lib/auth/twoFactor";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Vérification en deux étapes", robots: { index: false } };

export default async function TwoFactorVerificationPage() {
  const pending = await getPendingTwoFactor();
  if (!pending) redirect("/connexion");

  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 420 }}>
            <h1>Vérification en deux étapes</h1>
            <p>Saisissez le code à 6 chiffres généré par votre application d&apos;authentification.</p>
            <TwoFactorForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
