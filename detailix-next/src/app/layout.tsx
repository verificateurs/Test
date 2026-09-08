import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CartProvider } from "@/lib/cart/CartContext";
import { ComparatorProvider } from "@/lib/comparator/ComparatorContext";
import { GarageProvider } from "@/lib/garage/GarageContext";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — cosmétique et préparation esthétique automobile`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "Boutique de cosmétique et de préparation esthétique automobile : produits d'entretien, kits carrosserie, éclairage et accessoires, filtrés par la compatibilité de votre véhicule.",
  openGraph: { type: "website", locale: "fr_FR", siteName: SITE_NAME },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <CartProvider>
          <ComparatorProvider>
            <GarageProvider>
              <ToastProvider>{children}</ToastProvider>
            </GarageProvider>
          </ComparatorProvider>
        </CartProvider>
      </body>
    </html>
  );
}
