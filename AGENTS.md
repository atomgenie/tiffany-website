# Tiffany Tran portfolio

Portfolio site of Tiffany Tran, designer d’objets & médiation. Next.js 16 (App Router, TypeScript), self-hosted at https://tiffany.tamtanguy.fr.
This repo is the source of truth: content is edited here directly. Site language is French: keep user-facing text in French.

## Editing content (most tasks)

Changing text, adding a project, images, videos or PDFs, reordering projects, updating the CV, contacts…
**Follow `.claude/skills/edit-content/SKILL.md`** (step-by-step recipes and every block type with an example).
These edits only touch JSON, media files and `src/lib/site.ts`. They need no React or Next.js knowledge.

| Task | Command or file |
| --- | --- |
| Edit a project's text | `src/content/projets/<slug>.json` |
| Add images / videos / PDFs to a project | `npm run add-media -- <slug> <files>…` → paste the printed blocks into the JSON |
| Add a project | `npm run new-project -- <slug> "Nom" [--after <other-slug>]` |
| Reorder projects | the `entries` list in `src/lib/projects.ts` |
| Intro, contacts, CV / portfolio PDF | `src/lib/site.ts` |
| Check the content | `npm run check`: lists every problem with its file, place and fix |
| Before committing | `npm run verify` (check + lint + build) must pass |

Never type image sizes by hand, never reuse a media file name for a new image, and fix every `ERROR` from `npm run check`.

## How it works

- Content is static, in the repo; all pages are prerendered.
  - `src/content/projets/<slug>.json`: one file per project: name, subtitle, year, context, cover, links and content blocks (`Block` type in `src/lib/content.ts`).
  - `public/projets/<slug>/`: that project's images, videos and PDFs. All media under `public/` is in Git LFS (`.gitattributes`); new files are tracked automatically.
  - `src/lib/site.ts`: `siteUrl` from `SITE_URL` (build-time; Docker build arg in `compose.yaml`), intro, contacts, portrait and share image (`public/images/`), and `documents`: the current CV and PDF portfolio in `public/documents/`.
- `src/lib/projects.ts` imports the project files; the `entries` list sets the order and the numbers (01…). Also computes the giant initial.
- `src/content/renamed-projects.json`: old slug → new slug; `next.config.ts` turns them into 308 redirects.
- `scripts/check-content.mjs` (`npm run check`) validates all of the above: JSON shape, block types, rich text, colors, files exist, image sizes, 25 MiB limit, project list, redirects. Update its `BLOCKS` table when adding a block type or field.
- `scripts/add-media.mjs` and `scripts/new-project.mjs` are the helpers behind `npm run add-media` and `npm run new-project`.
- `src/components/Blocks.tsx` renders content blocks; `RichText.tsx` handles inline decorations (bold = green keyword).
- `src/components/ProjectStrip.tsx` (client) gets only card fields from the home page. Never import the content JSON or `lib/projects` from a client component, or all the content ships to the browser.
- Routes: `/`, `/projets/[slug]` (all slugs from `generateStaticParams`, unknown → `notFound()`), `/llms.txt`, `/llms-full.txt` (Markdown via `src/lib/markdown.ts`).

## Code changes

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

### Styling

- The design ("Bleu de travail") follows her own CV and PDF portfolio.
- Plain CSS in `src/app/globals.css`. No Tailwind. Content blocks use `block-*` classes; site chrome uses plain names.
- Identity sampled from her PDFs: `--ink` #00309C (ultramarine), `--lime` #A3B23F, `--lime-pale` #D3E2A5, lots of white. `--keyword` is a darker lime for readable green text. Light + dark via `prefers-color-scheme`. Reuse tokens; don't add raw colors.
- Fonts: Federo (titles) and Saira (text) via `next/font/google`, web stand-ins for her licensed Frastha and Eurostile.
- Motifs from the PDFs: titles ending with a full stop, contour lines (`Rings.tsx`, deterministic SVG), pale-green pastille/sticker, 01–17 margin index, green wavy dividers, giant cropped initial cut by the blue "Projet suivant" band.
- Check visual changes in a browser in both themes and at ~390px width.

### Config notes

- `cacheComponents: true`, `partialPrefetching: false`: all routes are static; with prefetching on, awaiting `params` outside `<Suspense>` warns.
- `<html>`/`<body>` have `suppressHydrationWarning` for browser-extension attributes (LanguageTool, Grammarly). Don't remove it.
- Images go through `next/image` (sharp is bundled in the standalone output); pass real `width`/`height` from the JSON.
  Served as WebP at quality 60 (`qualities` in `next.config.ts`). The first request for each image/width takes ~0.5 s to encode; after that it is served from `.next/cache/images`, a Docker volume (`image-cache`) that survives rebuilds. The cache is keyed by URL, so a replaced image needs a new file name.
- Cover images morph from the home strip to the project page with React `<ViewTransition name="cover-<slug>">`; names must stay unique per page.

### Static export

`npm run build:static` = `STATIC_EXPORT=1 next build` (→ `output: "export"`) + `scripts/export-static.mjs`. In that mode `next.config.ts`:

- turns off `cacheComponents` (partial prerendering can't be exported) and config `redirects`;
- uses the custom image loader `src/lib/image-loader.ts`: `<Image>` URLs become `/_img/<src>.<width>.webp`.

The script then encodes every `/_img/…` URL found in the exported HTML with sharp (cached in `.next/cache/static-images`, keyed by source mtime) and writes a meta-refresh page `out/projets/<old-slug>.html` per renamed project.
Route handlers (`llms*.txt`) export `generateStaticParams` returning `[{}]`: static export requires them to be marked static, and Cache Components forbids `dynamic = "force-static"`. Keep it on any new route handler.
Pages are `out/projets/<slug>.html`: the web server must map `/projets/x` to `x.html` (nginx `try_files $uri $uri.html $uri/ =404;`).

## Commands

```bash
npm run dev                       # dev server, http://localhost:3000
npm run check                     # validate content (fast, run after every content edit)
npm run verify                    # check + lint + build: must pass before committing
npm run add-media -- <slug> <files>…
npm run new-project -- <slug> "Nom" [--after <other-slug>]
docker compose up -d --build      # production (never Vercel)
docker compose exec web node scripts/warm-images.mjs   # after deploy: pre-generate optimized images
npm run build:static              # static export in out/ (no Node server needed)
```
