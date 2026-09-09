import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe", robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 420 }}>
            <h1>Choisir un nouveau mot de passe</h1>
            <ResetPasswordForm token={token} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
