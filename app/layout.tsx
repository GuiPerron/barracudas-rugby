import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const body = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });
const title = Barlow_Condensed({ subsets: ["latin"], weight: ["700", "800"], style: ["italic"], variable: "--font-title", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://barracudasrugby.com"),
  title: { default: "Barracudas Rugby · Saint-Jean-sur-Richelieu", template: "%s · Barracudas Rugby" },
  description: "Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu, depuis 1998. Calendrier, résultats, recrutement et commandites.",
  // Pré-lancement : pas d'indexation tant que le domaine n'est pas basculé
  robots: process.env.NEXT_PUBLIC_INDEX === "1" ? undefined : { index: false, follow: false },
  openGraph: { type: "website", locale: "fr_CA", siteName: "Barracudas Rugby", images: ["/img/DB2-1920.webp"] },
};

export const viewport: Viewport = { themeColor: "#132644", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr-CA" className={`${body.variable} ${title.variable}`}>
      <body>
        <a className="skip" href="#contenu">Aller au contenu</a>
        {children}
      </body>
    </html>
  );
}
