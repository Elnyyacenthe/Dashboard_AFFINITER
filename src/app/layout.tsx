import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { SITE_NAME, SITE_URL } from "@/lib/utils";
import { Providers } from "@/components/providers";

import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Back-office`,
    template: `%s · ${SITE_NAME} Admin`,
  },
  description: "Back-office Affiniter (admin + dev + service client).",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
