import Link from "next/link";
import { Rings } from "@/components/Rings";
import { contacts, documents } from "@/lib/site";

/** Blue top bar. On the home page it sits on the blue hero, without its own contour lines. */
export function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <header className={`site-header${home ? " site-header-home" : ""}`}>
      {home ? null : <Rings className="rings" rings={9} seed={11} />}
      <Link href="/" className="site-brand">
        Tran Tiffany.
      </Link>
      <nav className="site-nav" aria-label="Navigation principale">
        <Link href="/#projets">Projets</Link>
        <Link href="/#a-propos" className="site-nav-secondary">
          À propos
        </Link>
        <a className="pill pill-solid" href={documents.cv.href} target="_blank" rel="noopener noreferrer">
          CV ↓
        </a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <Rings className="rings" rings={10} seed={5} />
      <p className="site-footer-name">Tran Tiffany.</p>
      <div className="site-footer-links">
        {contacts
          .filter((c) => c.href)
          .map((c) => (
            <a key={c.label} href={c.href} {...(c.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {c.label} : {c.value}
            </a>
          ))}
        <a href={documents.cv.href} target="_blank" rel="noopener noreferrer">
          {documents.cv.label} (PDF)
        </a>
        <a href={documents.portfolio.href} target="_blank" rel="noopener noreferrer">
          {documents.portfolio.label} (PDF)
        </a>
      </div>
      <small>Designer d’objets spécialisée en médiation · Toulouse</small>
    </footer>
  );
}
