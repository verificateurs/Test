import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main>
        <section className="section">
          <div className="container" style={{ maxWidth: 420 }}>
            <h1>Connexion</h1>
            <LoginForm next={next} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
