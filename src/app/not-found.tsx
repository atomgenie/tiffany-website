import Link from "next/link";
import { SiteHeader } from "@/components/SiteChrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found">
        <h1>Page introuvable.</h1>
        <p>
          Cette page n’existe pas. <Link href="/">Retour au portfolio</Link>
        </p>
      </main>
    </>
  );
}
