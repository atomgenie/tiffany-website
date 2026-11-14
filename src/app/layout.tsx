import type { Metadata, Viewport } from "next";
import { Federo, Saira } from "next/font/google";
import { SiteFooter } from "@/components/SiteChrome";
import { portrait, shareImage, siteDescription, siteUrl } from "@/lib/site";
import "./globals.css";

// Web stand-ins for the PDFs' licensed fonts: Federo for Frastha (titles), Saira for Eurostile (text).
const federo = Federo({ weight: "400", subsets: ["latin"], variable: "--font-federo" });
const saira = Saira({ subsets: ["latin", "latin-ext"], variable: "--font-saira" });

const title = "Tiffany Tran — designer d’objets & médiation";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Tiffany Tran" },
  description: siteDescription,
  icons: { icon: portrait.src, apple: portrait.src },
  openGraph: {
    title,
    description: siteDescription,
    images: shareImage.src,
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00309c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (LanguageTool, Grammarly…) add attributes to <html>/<body> before
    // hydration; this only silences attribute mismatches on these two elements, not their children.
    <html lang="fr" className={`${federo.variable} ${saira.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
