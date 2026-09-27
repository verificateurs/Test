import type { Metadata } from "next";
import { Rajdhani, Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { RevealObserver } from "@/components/RevealObserver";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/Breadcrumb";

// CSP nonces are created per request, so the HTML cannot be statically cached.
export const dynamic = "force-dynamic";

const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

// Titres impactants / esprit compétition automobile : condensée, anguleuse, lisible en majuscules.
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading-face",
  display: "swap",
});

// Corps de texte : très lisible, neutre, ne rivalise pas avec les titres.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body-face",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Detailix",
  description:
    "Boutique en ligne de préparation et d'esthétique automobile : cosmétique carrosserie, préparation moteur, jantes et accessoires, avec filtre de compatibilité par code moteur.",
  url: BASE_URL,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${rajdhani.variable} ${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <JsonLd data={organizationJsonLd} />
        <SiteHeader />
        <RevealObserver />
        <main className="page-enter">
          {children}
        </main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}
