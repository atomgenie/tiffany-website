import type { Media } from "@/lib/content";

/** Public origin of the site, used for absolute URLs (Open Graph, llms.txt). Read at build time. */
export const siteUrl = (process.env.SITE_URL ?? "https://tiffany.tamtanguy.fr").replace(/\/$/, "");

export const siteDescription = "Tiffany Tran, designer d’objets spécialisée en médiation (Toulouse).";

/** Intro sentence (hero and À propos). The word "médiation" is shown as a green keyword. */
export const intro = "Bonjour, je suis Tiffany Tran, designer d’objets spécialisée en médiation (Toulouse).";

/** Cut-out portrait (À propos, favicon) and the default Open Graph image, in public/images/. */
export const portrait: Media = { src: "/images/portrait.png", width: 1800, height: 2400 };
export const shareImage: Media = { src: "/images/cover.jpg", width: 2400, height: 1800 };

/** Latest CV and PDF portfolio, in public/documents/. When Tiffany sends new versions, swap the files and these entries. */
export const documents = {
  cv: { href: "/documents/tran-tiffany-cv-2026.pdf", label: "CV 2026", size: "84 Ko" },
  portfolio: { href: "/documents/tran-tiffany-portfolio-2026.pdf", label: "Portfolio 2026", size: "50 Mo" },
};

export type Contact = { label: string; value: string; href: string };

export const contacts: Contact[] = [
  { label: "Mail", value: "tiffany.trantr@gmail.com", href: "mailto:tiffany.trantr@gmail.com" },
  { label: "Téléphone", value: "07 68 34 34 66", href: "tel:0768343466" },
  { label: "LinkedIn", value: "Tiffany Tran", href: "https://www.linkedin.com/in/tiffany-tran-364a80256" },
  { label: "Instagram", value: "tiffanytr.design", href: "https://www.instagram.com/tiffanytr.design" },
];
