import { homeMarkdown, projectMarkdown } from "@/lib/markdown";
import { projects } from "@/lib/projects";
import { siteDescription, siteUrl } from "@/lib/site";

// Marks the handler static for `npm run build:static` (output: "export"), which rejects unmarked GET handlers.
// `dynamic = "force-static"` would do it, but Cache Components forbids it in the normal build.
export function generateStaticParams() {
  return [{}];
}

/** Full text of every page as one Markdown document, companion to /llms.txt. */
export function GET() {
  const body = [
    "# Tiffany Tran — portfolio",
    "",
    `> ${siteDescription}`,
    "",
    `Source : ${siteUrl}/`,
    "",
    homeMarkdown(),
    "",
    "# Projets",
    "",
    ...projects.map((p) => projectMarkdown(p) + "\n"),
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
