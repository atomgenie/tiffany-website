import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ProjectStrip, type StripCard } from "@/components/ProjectStrip";
import { Rings } from "@/components/Rings";
import { SiteHeader } from "@/components/SiteChrome";
import { projects } from "@/lib/projects";
import { contacts, documents, intro, portrait } from "@/lib/site";

/** Bolds "médiation" in the intro sentence, like the green keywords of the PDFs. */
function Intro({ text }: { text: string }) {
  const parts = text.split(/(médiation)/);
  return (
    <>
      {parts.map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export default function Home() {
  // Only the fields the strip needs cross into the client bundle.
  const cards: StripCard[] = projects.map(({ slug, number, name, cover, coverFocus }) => ({
    slug,
    number,
    name,
    cover,
    coverFocus,
  }));

  return (
    <>
      <section className="hero">
        <Rings className="rings" rings={12} seed={11} />
        <SiteHeader home />
        <div className="hero-body">
          <div>
            <h1>
              Tran <span>Tiffany.</span>
            </h1>
            <p className="hero-lede">
              <Intro text={intro} />
            </p>
            <div className="hero-actions">
              <a className="pill pill-lime" href={documents.cv.href} target="_blank" rel="noopener noreferrer">
                {documents.cv.label} ↓
              </a>
              <a className="pill" href={documents.portfolio.href} target="_blank" rel="noopener noreferrer">
                {documents.portfolio.label} ↓
              </a>
            </div>
          </div>
          <div className="sticker sticker-spin" aria-hidden="true">
            design
            <br />
            de
            <br />
            médiation
          </div>
        </div>
        <ProjectStrip cards={cards} />
      </section>

      <section className="section" id="projets" aria-labelledby="projets-titre">
        <h2 className="section-title" id="projets-titre">
          Projets.
        </h2>
        <ol className="index-list">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/projets/${p.slug}`} className="index-row">
                <span className="index-number">{p.number}</span>
                <span>
                  <span className="index-name">{p.name}</span>
                  {p.subtitle ? <span className="index-sub">{p.subtitle}</span> : null}
                </span>
                {p.year ? <span className="pill index-year">{p.year}</span> : <span />}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="section about" id="a-propos" aria-labelledby="a-propos-titre">
        <div className="about-portrait">
          <Image src={portrait.src} alt="Portrait de Tiffany Tran" width={portrait.width!} height={portrait.height!} sizes="220px" />
        </div>
        <div>
          <h2 className="section-title" id="a-propos-titre">
            À propos.
          </h2>
          <p className="about-text">{intro}</p>
          <dl className="contact-list">
            {contacts.map((c) => (
              <div key={c.label}>
                <dt>{c.label} :</dt>
                <dd>
                  <a href={c.href} {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
          <div className="doc-links">
            <a className="pill" href={documents.cv.href} target="_blank" rel="noopener noreferrer">
              {documents.cv.label} ↓ <small>PDF, {documents.cv.size}</small>
            </a>
            <a className="pill" href={documents.portfolio.href} target="_blank" rel="noopener noreferrer">
              {documents.portfolio.label} ↓ <small>PDF, {documents.portfolio.size}</small>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
