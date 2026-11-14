import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { Blocks } from "@/components/Blocks";
import { Rings } from "@/components/Rings";
import { SiteHeader } from "@/components/SiteChrome";
import { getProject, nextProject, projects } from "@/lib/projects";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.name,
    description: project.subtitle ? `${project.name}, ${project.subtitle}.` : undefined,
    openGraph: { title: project.name, images: project.cover?.src },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const next = nextProject(project);

  return (
    <>
      <SiteHeader />
      <div className="project">
        <nav className="project-index" aria-label="Projets">
          <small>Projets</small>
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projets/${p.slug}`}
              title={p.name}
              aria-label={`${p.number}. ${p.name}`}
              aria-current={p.slug === project.slug ? "page" : undefined}
            >
              {p.number}
            </Link>
          ))}
        </nav>

        <main className="project-main">
          <header className="project-head">
            <Link href="/#projets" className="back-link">
              ← Tous les projets
            </Link>
            <h1 className="project-title">{project.name}.</h1>
            {project.subtitle ? <p className="project-subtitle">{project.subtitle}</p> : null}
            {project.year || project.context || project.links.length ? (
              <div className="project-meta">
                {project.year ? <span className="pill">{project.year}</span> : null}
                {project.context ? <span className="pill">{project.context}</span> : null}
                {project.links.map((link) => (
                  <a key={link.href} className="pill pill-lime" href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label} ↗
                  </a>
                ))}
              </div>
            ) : null}
            <div className="sticker" aria-hidden="true">
              {project.number}
            </div>
            {project.cover?.width && project.cover.height ? (
              <ViewTransition name={`cover-${project.slug}`} share="morph" default="none">
                <div className="project-cover">
                  <Image
                    src={project.cover.src}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 900px) 100vw, 860px"
                    style={{ objectPosition: `center ${project.coverFocus * 100}%` }}
                  />
                </div>
              </ViewTransition>
            ) : null}
          </header>

          <article className="project-content">
            <Blocks blocks={project.blocks} />
          </article>

          <div className="project-end" aria-hidden="true">
            <div className="project-letter">{project.letter}</div>
          </div>
        </main>
      </div>

      <Link href={`/projets/${next.slug}`} className="next-project">
        <Rings className="rings" rings={10} seed={5} />
        <span>
          <span className="next-label">Projet suivant →</span>
          <span className="next-name">
            <b>{next.number}</b>
            {next.name}.
          </span>
          {next.subtitle ? <span className="next-sub">{next.subtitle}</span> : null}
        </span>
        {next.cover?.width && next.cover.height ? (
          <span className="next-tile">
            <Image
              src={next.cover.src}
              alt=""
              fill
              sizes="340px"
              style={{ objectPosition: `center ${next.coverFocus * 100}%` }}
            />
          </span>
        ) : null}
      </Link>
    </>
  );
}
