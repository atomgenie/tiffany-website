// Copies media files into a project and prints the JSON blocks to paste into its file.
//
//   npm run add-media -- <slug> <file>...
//   npm run add-media -- la-retirada ~/Downloads/IMG_1234.HEIC ~/Downloads/plan.pdf ~/Downloads/film.mov
//
// - Photos (JPG, HEIC, TIFF…) become JPG, PNG/WebP stay as they are (transparency); all are rotated upright
//   and resized to at most 2400 px. The printed block has the right width and height.
// - MOV/M4V videos are converted to MP4 with ffmpeg (if installed); MP4/WebM are copied.
// - PDFs over 25 MiB are compressed with Ghostscript (if installed).
// - Other files are copied (use them in a "file" block).
// Files get a lowercase name without spaces, and never overwrite an existing file (a new name is chosen),
// because optimized images are cached by URL.

import { execFileSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const MAX_SIDE = 2400;
const MAX_BYTES = 25 * 1024 * 1024;

const [slug, ...inputs] = process.argv.slice(2);
if (!slug || !inputs.length) {
  console.error("Usage: npm run add-media -- <project-slug> <file>...");
  process.exit(1);
}
const dir = path.join("public/projets", slug);
if (!(await stat(`src/content/projets/${slug}.json`).catch(() => null))) {
  console.error(`No project "${slug}" (src/content/projets/${slug}.json). Create it first: npm run new-project -- ${slug} "Nom"`);
  process.exit(1);
}
await mkdir(dir, { recursive: true });

const exists = (file) => stat(file).then(() => true, () => false);
const has = (cmd) => {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

/** "IMG 1234 (copie).HEIC" → "img-1234-copie"; adds -2, -3… if the target exists. */
async function target(input, ext) {
  const base =
    path
      .basename(input, path.extname(input))
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "media";
  let name = `${base}${ext}`;
  for (let i = 2; await exists(path.join(dir, name)); i++) name = `${base}-${i}${ext}`;
  return path.join(dir, name);
}

const url = (file) => "/" + path.relative("public", file).split(path.sep).join("/");
const title = (input) => path.basename(input, path.extname(input));
const blocks = [];

for (const input of inputs) {
  if (!(await exists(input))) {
    console.error(`Not found: ${input}`);
    process.exitCode = 1;
    continue;
  }
  const ext = path.extname(input).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif", ".tif", ".tiff"].includes(ext)) {
    const keep = [".png", ".webp", ".gif", ".avif"].includes(ext);
    const out = await target(input, keep ? (ext === ".gif" ? ".gif" : ext) : ".jpg");
    let source = input;
    let tmp;
    if ([".heic", ".heif"].includes(ext)) {
      // sharp's prebuilt binaries can't read HEIC; macOS sips can.
      tmp = await mkdtemp(path.join(tmpdir(), "add-media-"));
      source = path.join(tmp, "in.jpg");
      execFileSync("sips", ["-s", "format", "jpeg", input, "--out", source], { stdio: "ignore" });
    }
    if (ext === ".gif") {
      await copyFile(source, out); // keep the animation
    } else {
      let image = sharp(source).rotate().resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true });
      image = keep ? image : image.flatten({ background: "#ffffff" }).jpeg({ quality: 85, mozjpeg: true });
      await image.toFile(out);
    }
    if (tmp) await rm(tmp, { recursive: true });
    const meta = await sharp(out).metadata();
    const size = meta.autoOrient ?? meta;
    blocks.push({ type: "image", media: { src: url(out), width: size.width, height: size.height } });
  } else if ([".mov", ".m4v", ".mp4", ".webm"].includes(ext)) {
    const convert = [".mov", ".m4v"].includes(ext);
    const out = await target(input, convert ? ".mp4" : ext);
    if (convert) {
      if (!has("ffmpeg")) {
        console.error(`${input}: install ffmpeg (brew install ffmpeg) to convert it to MP4, or upload it to YouTube.`);
        process.exitCode = 1;
        continue;
      }
      execFileSync("ffmpeg", ["-loglevel", "error", "-i", input, "-c:v", "libx264", "-crf", "23", "-movflags", "+faststart", "-an", out], {
        stdio: "inherit",
      });
    } else {
      await copyFile(input, out);
    }
    blocks.push({ type: "video", media: { src: url(out) } });
  } else {
    const out = await target(input, ext);
    if (ext === ".pdf" && (await stat(input)).size > MAX_BYTES && has("gs")) {
      // prettier-ignore
      execFileSync("gs", ["-q", "-dNOPAUSE", "-dBATCH", "-dSAFER", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.6",
        "-dDetectDuplicateImages=true", "-dDownsampleColorImages=true", "-dColorImageResolution=200",
        "-dColorImageDownsampleThreshold=1.1", "-dDownsampleGrayImages=true", "-dGrayImageResolution=200",
        "-dGrayImageDownsampleThreshold=1.1", "-dAutoFilterColorImages=false", "-dColorImageFilter=/DCTEncode",
        "-dAutoFilterGrayImages=false", "-dGrayImageFilter=/DCTEncode", "-dJPEGQ=85", `-sOutputFile=${out}`, input]);
    } else {
      await copyFile(input, out);
    }
    blocks.push(
      ext === ".pdf"
        ? { type: "pdf", title: title(input), media: { src: url(out) } }
        : { type: "file", title: title(input), media: { src: url(out) } },
    );
  }

  const out = blocks.at(-1).media.src;
  const size = (await stat(path.join("public", out))).size;
  if (size > MAX_BYTES) {
    console.error(`${out} is ${(size / 1024 / 1024).toFixed(1)} MiB, over the 25 MiB limit: compress it (see the edit-content skill).`);
    process.exitCode = 1;
  }
}

console.log(`\nAdded to ${dir}/. Paste these blocks into src/content/projets/${slug}.json (fix "title" if needed):\n`);
console.log(blocks.map((b) => "    " + JSON.stringify(b, null, 1).replace(/\n\s*/g, " ")).join(",\n"));
console.log(`\nFor the cover, use only the "media" object: "cover": {"src": …, "width": …, "height": …}`);
