import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 420 }}>
            <h1>Mot de passe oublié</h1>
            <p>Indiquez votre adresse email, nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
            <ForgotPasswordForm />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
