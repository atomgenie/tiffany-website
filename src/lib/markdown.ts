import type { Block, RichText } from "@/lib/content";
import type { Project } from "@/lib/projects";
import { contacts, documents, intro, siteUrl } from "@/lib/site";

const absolute = (href: string) => (href.startsWith("/") ? siteUrl + href : href);

export const projectUrl = (project: Project) => `${siteUrl}/projets/${project.slug}`;

export function richToMarkdown(value?: RichText): string {
  return (value ?? [])
    .map(([text, decorations = []]) => {
      if (!text) return "";
      let out = text;
      let href: string | undefined;
      for (const [kind, arg] of decorations) {
        if (kind === "b") out = `**${out}**`;
        else if (kind === "i") out = `*${out}*`;
        else if (kind === "s") out = `~~${out}~~`;
        else if (kind === "c") out = `\`${out}\``;
        else if (kind === "a" && arg) href = absolute(arg);
      }
      return href ? `[${out}](${href})` : out;
    })
    .join("");
}

export const richToPlain = (value?: RichText) => (value ?? []).map(([text]) => text).join("");

function mediaLine(block: Block, label: string): string {
  const caption = richToMarkdown(block.caption);
  if (block.youtube) return `[${caption || "Vidéo YouTube"}](https://youtu.be/${block.youtube})`;
  const src = block.media?.src ? absolute(block.media.src) : "";
  if (block.type === "image") return `![${richToPlain(block.caption)}](${src})`;
  return `[${caption || block.title || label}](${src})`;
}

function blocksToLines(blocks: Block[], indent = ""): string[] {
  const lines: string[] = [];
  let number = 0;
  for (const block of blocks) {
    number = block.type === "numbered_list" ? number + 1 : 0;
    const text = richToMarkdown(block.rich);
    const children = block.children?.length ? blocksToLines(block.children, indent + "  ") : [];
    switch (block.type) {
      case "text":
        if (text) lines.push(indent + text, "");
        lines.push(...children);
        break;
      case "header":
        lines.push(`## ${text}`, "");
        break;
      case "sub_header":
        lines.push(`### ${text}`, "");
        break;
      case "sub_sub_header":
        lines.push(`#### ${text}`, "");
        break;
      case "quote":
        lines.push(`${indent}> ${text}`, "");
        break;
      case "bulleted_list":
      case "numbered_list":
        lines.push(`${indent}${block.type === "bulleted_list" ? "-" : `${block.start ?? number}.`} ${text}`, ...children);
        if (blocks[blocks.indexOf(block) + 1]?.type !== block.type) lines.push("");
        break;
      case "callout": {
        const body = [text, ...blocksToLines(block.children ?? []).filter(Boolean)].filter(Boolean);
        lines.push(...body.map((line) => `${indent}> ${line}`), "");
        break;
      }
      case "column_list":
        for (const column of block.children ?? []) lines.push(...blocksToLines(column.children ?? [], indent));
        break;
      case "image":
      case "video":
      case "pdf":
      case "file":
        lines.push(indent + mediaLine(block, block.type === "video" ? "Vidéo" : "Fichier"), "");
        break;
    }
  }
  return lines;
}

/** Converts blocks to Markdown, collapsing runs of blank lines. */
export function blocksToMarkdown(blocks: Block[]): string {
  return blocksToLines(blocks)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Home page: intro, contacts and PDFs. */
export function homeMarkdown(): string {
  return [
    intro,
    "",
    ...contacts.map((c) => `- ${c.label} : ${c.href.startsWith("http") ? `[${c.value}](${c.href})` : c.value}`),
    "",
    `- [${documents.cv.label} (PDF)](${siteUrl}${documents.cv.href})`,
    `- [${documents.portfolio.label} (PDF, ${documents.portfolio.size})](${siteUrl}${documents.portfolio.href})`,
  ].join("\n");
}

/** First sentence-ish of a project's text, for one-line summaries. */
export function projectSummary(project: Project, max = 220): string {
  const first = project.blocks.find((b) => b.type === "text" && richToPlain(b.rich).trim());
  const text = richToPlain(first?.rich).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function projectMarkdown(project: Project): string {
  const meta = [
    `- Page : ${projectUrl(project)}`,
    project.subtitle && `- Type : ${project.subtitle}`,
    project.year && `- Année : ${project.year}`,
    project.context && `- Contexte : ${project.context}`,
    ...project.links.map((link) => `- ${link.label} : ${link.href}`),
  ].filter(Boolean);
  return [`## ${project.number}. ${project.name}`, "", ...meta, "", blocksToMarkdown(project.blocks).replace(/^(#{2,5}) /gm, "#$1 ")].join("\n");
}
