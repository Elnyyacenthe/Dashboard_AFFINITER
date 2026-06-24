import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "@/lib/utils";
import { Providers } from "@/components/providers";

// Fonts servies en local depuis @fontsource-variable (plus de fetch Google Fonts)
import "@fontsource-variable/inter";
import "@fontsource-variable/playfair-display";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Back-office`,
    template: `%s · ${SITE_NAME} Admin`,
  },
  description: "Back-office Affinité (admin + dev + service client).",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
