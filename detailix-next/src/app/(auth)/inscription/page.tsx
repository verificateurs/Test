import type { Metadata } from "next";
import { SignupForm } from "./SignupForm";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 420 }}>
            <h1>Créer un compte</h1>
            <SignupForm next={next} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
