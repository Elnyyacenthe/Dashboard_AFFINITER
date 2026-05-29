import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SITE_NAME, SITE_URL } from "@/lib/utils";
import { AgeGate } from "@/components/layout/age-gate";
import { Providers } from "@/components/providers";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Annonces escorts au Cameroun`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Plateforme N°1 d'annonces d'escorts et ndolo au Cameroun. Douala, Yaoundé, Bafoussam, Kribi… Rencontres adultes 18+ vérifiées.",
  keywords: ["escort cameroun", "ndolo", "annonce douala", "annonce yaoundé", "rencontre adulte"],
  robots: { index: true, follow: true },
  openGraph: {
    title: `${SITE_NAME} — Annonces escorts au Cameroun`,
    description: "Plateforme d'annonces escorts au Cameroun (18+).",
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>
          <AgeGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
