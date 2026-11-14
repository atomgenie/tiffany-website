// Creates a project and adds it to the site.
//
//   npm run new-project -- <slug> "Nom du projet" [--after <other-slug>]
//
// Creates src/content/projets/<slug>.json (a minimal project to fill in), the media folder
// public/projets/<slug>/, and adds the project to the list in src/lib/projects.ts
// (at the end, or right after <other-slug>). If the JSON file already exists, it is only added to the list.

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const afterIndex = args.indexOf("--after");
const after = afterIndex >= 0 ? args.splice(afterIndex, 2)[1] : undefined;
const [slug, name] = args;

if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run new-project -- <slug> "Nom du projet" [--after <other-slug>]');
  console.error("The slug is the URL (/projets/<slug>): lowercase words joined by -, no accents, e.g. le-potager-gourmand");
  process.exit(1);
}

const json = `src/content/projets/${slug}.json`;
if (!(await stat(json).catch(() => null))) {
  if (!name) {
    console.error(`Give the project name: npm run new-project -- ${slug} "Nom du projet"`);
    process.exit(1);
  }
  const project = {
    slug,
    name,
    subtitle: "type de projet (contexte)",
    year: new Date().getFullYear(),
    context: "Lieu ou partenaire, ville",
    blocks: [{ type: "text", rich: [["Présentation du projet, avec un "], ["mot-clé", [["b"]]], [" en vert."]] }],
  };
  await writeFile(json, JSON.stringify(project, null, 2) + "\n");
  console.log(`Created ${json}`);
}
await mkdir(`public/projets/${slug}`, { recursive: true });

// Register in src/lib/projects.ts: one import line and one entry in the `entries` list.
const file = "src/lib/projects.ts";
let ts = await readFile(file, "utf8");
if (ts.includes(`@/content/projets/${slug}.json"`)) {
  console.log(`${slug} is already in ${file}`);
} else {
  const id = slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()).replace(/^(\d)/, "p$1");
  const imports = [...ts.matchAll(/^import (\w+) from "@\/content\/projets\/([^"]+)\.json";\n/gm)];
  const last = imports.at(-1);
  const at = last.index + last[0].length;
  ts = ts.slice(0, at) + `import ${id} from "@/content/projets/${slug}.json";\n` + ts.slice(at);

  const afterId = after && imports.find(([, , s]) => s === after)?.[1];
  if (after && !afterId) {
    console.error(`No project "${after}" in ${file}; adding ${slug} at the end.`);
  }
  ts = afterId
    ? ts.replace(new RegExp(`(const entries = \\[[\\s\\S]*?\\n  ${afterId},\\n)`), `$1  ${id},\n`)
    : ts.replace(/(const entries = \[[\s\S]*?)(\n\] as)/, `$1\n  ${id},$2`);
  await writeFile(file, ts);
  console.log(`Added ${slug} to ${file}${afterId ? ` after ${after}` : " (last)"}`);
}

console.log(`\nNext: add media with  npm run add-media -- ${slug} <files>…  then fill in ${json} and run  npm run check`);
