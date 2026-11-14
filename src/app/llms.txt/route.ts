import { projectSummary, projectUrl } from "@/lib/markdown";
import { projects } from "@/lib/projects";
import { contacts, documents, siteDescription, siteUrl } from "@/lib/site";

// Marks the handler static for `npm run build:static` (output: "export"), which rejects unmarked GET handlers.
// `dynamic = "force-static"` would do it, but Cache Components forbids it in the normal build.
export function generateStaticParams() {
  return [{}];
}

/** llms.txt (https://llmstxt.org): a Markdown index of the site for language models. */
export function GET() {
  const body = [
    "# Tiffany Tran — portfolio",
    "",
    `> ${siteDescription} Portfolio de projets de design d’objets, de médiation, de scénographie et de design graphique.`,
    "",
    ...contacts.filter((c) => !c.href?.startsWith("tel:")).map((c) => `- ${c.label} : ${c.href?.startsWith("http") ? c.href : c.value}`),
    `- ${documents.cv.label} : ${siteUrl}${documents.cv.href}`,
    `- ${documents.portfolio.label} : ${siteUrl}${documents.portfolio.href}`,
    "",
    "## Projets",
    "",
    ...projects.map((p) => {
      const summary = projectSummary(p);
      return `- [${p.name}](${projectUrl(p)})${p.subtitle ? ` (${p.subtitle})` : ""}${summary ? `: ${summary}` : ""}`;
    }),
    "",
    "## Optional",
    "",
    `- [Contenu complet](${siteUrl}/llms-full.txt): texte intégral de toutes les pages, en Markdown`,
    `- [Accueil](${siteUrl}/): page d’accueil avec CV et portfolio PDF 2026`,
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
