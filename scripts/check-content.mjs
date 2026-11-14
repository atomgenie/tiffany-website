// Checks the site content and explains every problem in plain words: `npm run check`.
// Run it after any content change. Exit code 1 if there is an error; warnings don't fail.
//
// Checks: every project JSON (fields, block types, rich text, colors), that every referenced file exists
// with the right image size and stays under 25 MiB, the project list in src/lib/projects.ts,
// src/content/renamed-projects.json, and the files referenced in src/lib/site.ts.

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PROJECTS_DIR = "src/content/projets";
const MAX_BYTES = 25 * 1024 * 1024; // Cloudflare Pages per-file limit
const MAX_IMAGE_SIDE = 2400;

const errors = [];
const warnings = [];
const error = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const exists = (file) => stat(file).then((s) => s, () => null);

// --- What a project file may contain -------------------------------------------------------------

const PROJECT_FIELDS = {
  slug: "string",
  name: "string",
  subtitle: "string",
  year: "number",
  context: "string",
  cover: "media",
  coverFocus: "number",
  links: "array",
  blocks: "array",
};
const REQUIRED_PROJECT_FIELDS = ["slug", "name", "blocks"];

const COLORS = ["gray", "brown", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "red"];
const ALL_COLORS = ["default", ...COLORS, ...COLORS.map((c) => `${c}_background`)];

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"];
const VIDEO_EXT = [".mp4", ".webm"];

// Allowed fields per block type ("type" is always allowed). `required` must be present.
const BLOCKS = {
  text: { fields: ["rich", "color", "children"] },
  header: { fields: ["rich", "color"], required: ["rich"] },
  sub_header: { fields: ["rich", "color"], required: ["rich"] },
  sub_sub_header: { fields: ["rich", "color"], required: ["rich"] },
  quote: { fields: ["rich", "color", "size", "children"], required: ["rich"] },
  bulleted_list: { fields: ["rich", "color", "children"], required: ["rich"] },
  numbered_list: { fields: ["rich", "color", "children", "start"], required: ["rich"] },
  callout: { fields: ["rich", "color", "icon", "children"] },
  divider: { fields: [] },
  column_list: { fields: ["children"], required: ["children"] },
  column: { fields: ["children", "ratio"], required: ["children"] },
  image: { fields: ["media", "caption", "display"], required: ["media"] },
  video: { fields: ["media", "youtube", "title", "display", "caption"] },
  pdf: { fields: ["media", "title", "display", "caption"], required: ["media"] },
  file: { fields: ["media", "title"], required: ["media", "title"] },
};
const DISPLAY_FIELDS = { width: "number", height: "number", fullWidth: "boolean", pageWidth: "boolean", align: "string" };

// --- Helpers -------------------------------------------------------------------------------------

/** Files referenced from the content, to report unused media at the end. */
const referenced = new Set();
/** Cache of image sizes, keyed by file path. */
const sizes = new Map();

async function checkFile(where, src, { kind, width, height }) {
  if (typeof src !== "string" || !src.startsWith("/")) {
    return error(where, `"src" must be a path starting with "/" (e.g. "/projets/<slug>/photo.jpg"), got ${JSON.stringify(src)}`);
  }
  if (/[\s]/.test(src) || src !== src.toLowerCase()) {
    warn(where, `${src}: use lowercase file names without spaces`);
  }
  const file = path.join("public", decodeURI(src));
  referenced.add(file);
  const info = await exists(file);
  if (!info) return error(where, `${src} does not exist (expected the file public${src})`);
  if (info.size > MAX_BYTES) {
    error(where, `${src} is ${(info.size / 1024 / 1024).toFixed(1)} MiB, over the 25 MiB limit: compress it (see the edit-content skill, "Adding media")`);
  }
  const ext = path.extname(src).toLowerCase();
  if (kind === "image") {
    if (!IMAGE_EXT.includes(ext)) return error(where, `${src}: images must be ${IMAGE_EXT.join(", ")} (convert HEIC/TIFF to JPG)`);
    if (ext === ".svg") return;
    let size = sizes.get(file);
    if (!size) {
      // Displayed size: a photo with an EXIF rotation shows with width and height swapped.
      const meta = await sharp(file).metadata();
      size = meta.autoOrient ?? { width: meta.width, height: meta.height };
      sizes.set(file, size);
    }
    if (width == null || height == null) {
      error(where, `"width" and "height" are required for images; add "width": ${size.width}, "height": ${size.height}`);
    } else if (size.width !== width || size.height !== height) {
      error(where, `${src} is ${size.width}×${size.height} px but the JSON says ${width}×${height}; use "width": ${size.width}, "height": ${size.height}`);
    }
    if (Math.max(size.width, size.height) > MAX_IMAGE_SIDE) {
      warn(where, `${src} is ${size.width}×${size.height} px; resize to at most ${MAX_IMAGE_SIDE} px (sips -Z ${MAX_IMAGE_SIDE})`);
    }
  } else if (kind === "video" && !VIDEO_EXT.includes(ext)) {
    error(where, `${src}: videos must be ${VIDEO_EXT.join(" or ")} (convert with ffmpeg, see the edit-content skill)`);
  } else if (kind === "pdf" && ext !== ".pdf") {
    error(where, `${src}: a "pdf" block needs a .pdf file (use a "file" block for other downloads)`);
  }
}

async function checkMedia(where, media, kind) {
  if (!isObject(media)) return error(where, `must be an object like {"src": "/projets/<slug>/photo.jpg", "width": 1600, "height": 1200}`);
  for (const key of Object.keys(media)) {
    if (!["src", "width", "height"].includes(key)) error(where, `unknown field "${key}" (allowed: src, width, height)`);
  }
  for (const key of ["width", "height"]) {
    if (media[key] != null && !Number.isInteger(media[key])) error(`${where}.${key}`, `must be a whole number of pixels`);
  }
  await checkFile(where, media.src, { kind, width: media.width, height: media.height });
}

function checkColor(where, color) {
  if (!ALL_COLORS.includes(color)) {
    error(where, `unknown color ${JSON.stringify(color)}; use one of ${COLORS.join(", ")}, optionally with "_background" (e.g. "teal_background")`);
  }
}

function checkRich(where, rich) {
  const example = `e.g. [["Du texte "], ["un mot-clé", [["b"]]], ["."]]`;
  if (!Array.isArray(rich)) return error(where, `rich text must be a list of segments, ${example}`);
  rich.forEach((segment, i) => {
    const at = `${where}[${i}]`;
    if (typeof segment === "string") return error(at, `wrap the text in a list: [${JSON.stringify(segment)}], ${example}`);
    if (!Array.isArray(segment) || typeof segment[0] !== "string" || segment.length > 2) {
      return error(at, `each segment is ["text"] or ["text", [decorations]], ${example}`);
    }
    if (segment.length === 1) return;
    const decorations = segment[1];
    if (!Array.isArray(decorations)) return error(at, `decorations must be a list of lists, e.g. [["b"]] or [["a", "https://…"]]`);
    decorations.forEach((d, j) => {
      const dat = `${at}[1][${j}]`;
      if (typeof d === "string") return error(dat, `write [${JSON.stringify(d)}], not ${JSON.stringify(d)} (each decoration is itself a list)`);
      if (!Array.isArray(d)) return error(dat, `each decoration is a list, e.g. ["b"]`);
      const [kind, arg] = d;
      if (["b", "i", "s", "_", "c"].includes(kind)) {
        if (d.length !== 1) error(dat, `["${kind}"] takes no argument`);
      } else if (kind === "a") {
        if (typeof arg !== "string" || !/^(https?:\/\/|mailto:|tel:|\/)/.test(arg)) {
          error(dat, `a link is ["a", "https://…"] (or ["a", "/projets/<slug>"] for a page of the site)`);
        } else if (arg.startsWith("/projets/")) {
          internalLinks.push({ where: dat, slug: arg.slice("/projets/".length).split(/[#?]/)[0] });
        }
      } else if (kind === "h") {
        checkColor(dat, arg);
      } else {
        error(dat, `unknown decoration ${JSON.stringify(kind)}; use "b" (green keyword), "i", "s", "_", "c", "a" (link) or "h" (color)`);
      }
    });
  });
}

const internalLinks = [];

async function checkBlocks(where, blocks, parentType) {
  if (!Array.isArray(blocks)) return error(where, `must be a list of blocks [ {...}, {...} ]`);
  for (const [i, block] of blocks.entries()) await checkBlock(`${where}[${i}]`, block, parentType);
}

async function checkBlock(where, block, parentType) {
  if (!isObject(block)) return error(where, `each block must be an object with a "type"`);
  const spec = BLOCKS[block.type];
  if (!spec) {
    return error(where, `unknown block type ${JSON.stringify(block.type)}; use one of ${Object.keys(BLOCKS).join(", ")}`);
  }
  const at = `${where} (${block.type})`;
  for (const key of Object.keys(block)) {
    if (key !== "type" && !spec.fields.includes(key)) {
      error(at, `field "${key}" is not used by a "${block.type}" block (allowed: ${spec.fields.join(", ") || "none"})`);
    }
  }
  for (const key of spec.required ?? []) {
    if (block[key] === undefined) error(at, `missing required field "${key}"`);
  }
  if (block.type === "column" && parentType !== "column_list") error(at, `a "column" block can only be inside a "column_list"`);
  if (parentType === "column_list" && block.type !== "column") error(at, `a "column_list" may only contain "column" blocks`);

  if (block.rich !== undefined) checkRich(`${where}.rich`, block.rich);
  if (block.caption !== undefined) checkRich(`${where}.caption`, block.caption);
  if (block.color !== undefined) checkColor(`${where}.color`, block.color);
  if (block.size !== undefined && block.size !== "large") error(`${where}.size`, `only "large" is supported`);
  if (block.start !== undefined && !Number.isInteger(block.start)) error(`${where}.start`, `must be a whole number`);
  if (block.icon !== undefined && typeof block.icon !== "string") error(`${where}.icon`, `must be an emoji string, e.g. "💡"`);
  if (block.title !== undefined && typeof block.title !== "string") error(`${where}.title`, `must be a string`);

  if (block.display !== undefined) {
    if (!isObject(block.display)) error(`${where}.display`, `must be an object, e.g. {"width": 600}`);
    else {
      for (const [key, value] of Object.entries(block.display)) {
        if (!DISPLAY_FIELDS[key]) error(`${where}.display`, `unknown field "${key}" (allowed: ${Object.keys(DISPLAY_FIELDS).join(", ")})`);
        else if (typeof value !== DISPLAY_FIELDS[key]) error(`${where}.display.${key}`, `must be a ${DISPLAY_FIELDS[key]}`);
      }
      if (block.display.align && !["left", "center", "right"].includes(block.display.align)) {
        error(`${where}.display.align`, `must be "left", "center" or "right"`);
      }
    }
  }

  if (block.type === "video") {
    if (!block.youtube === !block.media) error(at, `give either "youtube" (the video id) or "media" (an MP4 file), not both or neither`);
    if (block.youtube !== undefined && !/^[\w-]{11}$/.test(block.youtube)) {
      error(`${where}.youtube`, `must be the 11-character video id only (from https://youtu.be/ID or watch?v=ID), got ${JSON.stringify(block.youtube)}`);
    }
  }
  if (block.media !== undefined) {
    const kind = { image: "image", video: "video", pdf: "pdf" }[block.type] ?? "file";
    await checkMedia(`${where}.media`, block.media, kind);
  }

  if (block.children !== undefined) await checkBlocks(`${where}.children`, block.children, block.type);
  if (block.type === "column_list") {
    const ratios = (block.children ?? []).map((c) => c?.ratio);
    if (ratios.length < 2) warn(at, `a column_list usually has at least 2 columns`);
    if (ratios.every((r) => typeof r === "number")) {
      const sum = ratios.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.02) error(at, `the column "ratio" values add up to ${sum.toFixed(2)}; they must add up to 1`);
    } else if (ratios.some((r) => r !== undefined)) {
      error(at, `give a "ratio" to every column, or to none (equal widths)`);
    }
  }
}

// --- Projects ------------------------------------------------------------------------------------

const files = (await readdir(PROJECTS_DIR)).filter((f) => f.endsWith(".json")).sort();
const slugs = new Set(files.map((f) => f.slice(0, -5)));

for (const fileName of files) {
  const file = path.join(PROJECTS_DIR, fileName);
  const slug = fileName.slice(0, -5);
  let project;
  try {
    project = JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    error(file, `invalid JSON: ${e.message} (look for a missing or extra comma, quote or bracket)`);
    continue;
  }
  if (!isObject(project)) {
    error(file, `must contain one object { "slug": …, "name": …, "blocks": [ … ] }`);
    continue;
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) error(file, `the file name must be lowercase words joined by "-", without accents`);
  for (const key of Object.keys(project)) {
    if (!PROJECT_FIELDS[key]) error(file, `unknown field "${key}" (allowed: ${Object.keys(PROJECT_FIELDS).join(", ")})`);
  }
  for (const key of REQUIRED_PROJECT_FIELDS) {
    if (project[key] === undefined) error(file, `missing required field "${key}"`);
  }
  for (const [key, type] of Object.entries(PROJECT_FIELDS)) {
    const value = project[key];
    if (value === undefined || type === "media" || key === "year") continue;
    const ok = type === "array" ? Array.isArray(value) : typeof value === type;
    if (!ok) error(`${file} › ${key}`, `must be a ${type}`);
  }
  if (project.slug !== undefined && project.slug !== slug) {
    error(`${file} › slug`, `is "${project.slug}" but must equal the file name "${slug}"`);
  }
  if (typeof project.name === "string" && /\.\s*$/.test(project.name)) {
    error(`${file} › name`, `remove the final "." (the page adds it)`);
  }
  if (project.year !== undefined && !Number.isInteger(project.year)) error(`${file} › year`, `must be a number like 2026, not a string`);
  if (project.coverFocus !== undefined && !(project.coverFocus >= 0 && project.coverFocus <= 1)) {
    error(`${file} › coverFocus`, `must be between 0 (top) and 1 (bottom)`);
  }
  if (project.cover !== undefined) await checkMedia(`${file} › cover`, project.cover, "image");
  else warn(file, `no "cover" image: the home page card will be empty`);
  if (Array.isArray(project.links)) {
    project.links.forEach((link, i) => {
      if (!isObject(link) || typeof link.label !== "string" || typeof link.href !== "string" || Object.keys(link).length !== 2) {
        error(`${file} › links[${i}]`, `must be {"label": "Voir la vidéo", "href": "https://…"}`);
      }
    });
  }
  if (Array.isArray(project.blocks)) await checkBlocks(`${file} › blocks`, project.blocks);

  if (!(await exists(path.join("public/projets", slug)))) warn(file, `no media folder public/projets/${slug}/`);
}

for (const { where, slug } of internalLinks) {
  if (!slugs.has(slug)) error(where, `links to /projets/${slug}, which does not exist`);
}

// --- Project order: src/lib/projects.ts ----------------------------------------------------------

const projectsTs = await readFile("src/lib/projects.ts", "utf8");
const imports = new Map(
  [...projectsTs.matchAll(/^import (\w+) from "@\/content\/projets\/([^"]+)\.json";$/gm)].map(([, id, slug]) => [id, slug]),
);
const list = projectsTs.match(/const entries = \[([\s\S]*?)\]/)?.[1] ?? "";
const listed = [...list.matchAll(/\b(\w+)\b/g)].map(([, id]) => id);
for (const slug of slugs) {
  if (![...imports.values()].includes(slug)) {
    error("src/lib/projects.ts", `${PROJECTS_DIR}/${slug}.json is not imported, so it is not on the site; run: npm run new-project -- ${slug}`);
  }
}
for (const [id, slug] of imports) {
  if (!slugs.has(slug)) error("src/lib/projects.ts", `imports ${slug}.json, which does not exist; remove the import and "${id}" from the list`);
  if (!listed.includes(id)) error("src/lib/projects.ts", `"${id}" is imported but missing from the "entries" list`);
}
const dupes = listed.filter((id, i) => listed.indexOf(id) !== i);
if (dupes.length) error("src/lib/projects.ts", `listed twice: ${[...new Set(dupes)].join(", ")}`);

// --- Renamed projects ----------------------------------------------------------------------------

const renamedFile = "src/content/renamed-projects.json";
const renamed = JSON.parse(await readFile(renamedFile, "utf8"));
for (const [from, to] of Object.entries(renamed)) {
  if (!slugs.has(to)) error(`${renamedFile} › ${from}`, `redirects to "${to}", which is not a project`);
  if (slugs.has(from)) error(`${renamedFile} › ${from}`, `is an existing project slug; a redirect would hide it`);
}

// --- site.ts -------------------------------------------------------------------------------------

const siteTs = await readFile("src/lib/site.ts", "utf8");
for (const [, src, w, h] of siteTs.matchAll(/\{ src: "([^"]+)", width: (\d+), height: (\d+) \}/g)) {
  await checkFile("src/lib/site.ts", src, { kind: "image", width: Number(w), height: Number(h) });
}
for (const [, href] of siteTs.matchAll(/href: "(\/[^"]+)"/g)) await checkFile("src/lib/site.ts", href, { kind: "file" });

// --- Unused media --------------------------------------------------------------------------------

for (const dir of await readdir("public/projets")) {
  if (!slugs.has(dir)) {
    warn(`public/projets/${dir}/`, `no project "${dir}" uses this folder; delete it or rename it to the project's slug`);
    continue;
  }
  for (const name of await readdir(path.join("public/projets", dir), { recursive: true })) {
    const file = path.join("public/projets", dir, name);
    if (name.startsWith(".") || (await stat(file)).isDirectory()) continue;
    if (!referenced.has(file)) warn(file, `not used by any block; delete it if it is not needed`);
  }
}

// --- Report --------------------------------------------------------------------------------------

for (const w of warnings) console.log(`warning  ${w}`);
for (const e of errors) console.log(`ERROR    ${e}`);
console.log(
  `\n${files.length} projects checked: ${errors.length} error${errors.length === 1 ? "" : "s"}, ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`,
);
process.exit(errors.length ? 1 : 0);
