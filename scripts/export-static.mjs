// Finishes the static export in out/ (run by `npm run build:static`, after `next build` with STATIC_EXPORT=1):
// 1. Generates every resized WebP the pages reference (/_img/<src>.<width>.webp, see src/lib/image-loader.ts).
//    Encoded files are kept in .next/cache/static-images, so a rebuild only encodes new or changed images.
// 2. Writes an HTML redirect page for each old project slug (src/content/renamed-projects.json).

import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import path from "node:path";
import sharp from "sharp";

const renamedProjects = JSON.parse(await readFile("src/content/renamed-projects.json", "utf8"));

const out = "out";
const cache = ".next/cache/static-images";
const quality = 60; // images.qualities in next.config.ts

const mtime = (file) => stat(file).then((s) => s.mtimeMs, () => -1);

// 1. Images
const pages = (await readdir(out, { recursive: true })).filter((f) => f.endsWith(".html"));
const urls = new Set();
for (const page of pages) {
  const html = await readFile(path.join(out, page), "utf8");
  for (const [url] of html.matchAll(/\/_img\/[^\s"',]+?\.\d+\.webp/g)) urls.add(url);
}

const queue = [...urls];
let encoded = 0;
const started = Date.now();

await Promise.all(
  Array.from({ length: availableParallelism() }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const [, src, width] = url.match(/^\/_img(\/.+)\.(\d+)\.webp$/);
      const source = path.join("public", decodeURI(src));
      const cached = path.join(cache, decodeURI(url));
      if ((await mtime(cached)) < (await mtime(source))) {
        if ((await mtime(source)) < 0) throw new Error(`${url}: ${source} not found`);
        await mkdir(path.dirname(cached), { recursive: true });
        await sharp(source)
          .rotate()
          .resize({ width: Number(width), withoutEnlargement: true })
          .webp({ quality })
          .toFile(cached);
        encoded++;
      }
      const target = path.join(out, decodeURI(url));
      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(cached, target);
    }
  }),
);

console.log(
  `${pages.length} pages, ${urls.size} image variants (${encoded} encoded, ${urls.size - encoded} from cache), ${Math.round((Date.now() - started) / 1000)}s`,
);

// 2. Redirects for renamed projects
const escape = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
for (const [from, to] of Object.entries(renamedProjects)) {
  const href = escape(`/projets/${to}`);
  await writeFile(
    path.join(out, "projets", `${from}.html`),
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Redirection</title>` +
      `<meta name="robots" content="noindex"><link rel="canonical" href="${href}">` +
      `<meta http-equiv="refresh" content="0; url=${href}">` +
      `<script>location.replace(${JSON.stringify(`/projets/${to}`)} + location.hash)</script></head>` +
      `<body><p>Cette page a déménagé : <a href="${href}">${href}</a>.</p></body></html>\n`,
  );
}
console.log(`${Object.keys(renamedProjects).length} redirects`);
