import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { RevealObserver } from "@/components/RevealObserver";

// CSP nonces are created per request, so the HTML cannot be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Detailix — Préparation & Esthétique Automobile",
    template: "%s | Detailix",
  },
  description:
    "Découvrez les meilleures marques de cosmétique carrosserie, préparation moteur, jantes, kits carrosserie et bien plus pour votre véhicule. Filtres compatibilité moteur inclus.",
  robots: { index: true, follow: true },
  openGraph: {
    siteName: "Detailix",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Fonts via CSS @import dans globals.css — aucune ressource tierce inline */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <SiteHeader />
        <RevealObserver />
        <main className="page-enter">
          {children}
        </main>
      </body>
    </html>
  );
}
