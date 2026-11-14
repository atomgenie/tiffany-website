@AGENTS.md

# Tiffany Tran portfolio

Self-hosted Next.js 16 (App Router, TypeScript) portfolio for Tiffany Tran, designer d’objets & médiation.
This is the final site and the source of truth: content is edited here directly (skill `edit-content`).
It started from a Notion page merged with her 2026 PDF portfolio; there is no import from either anymore.
The design ("Bleu de travail") follows her own CV and portfolio.
Deployed with `output: "standalone"` behind a reverse proxy at https://tiffany.tamtanguy.fr — never Vercel.
`npm run build:static` makes a plain static export in `out/` instead (see Static export below).
Site language is French: keep user-facing text in French.

## How it works

- Content is static, in the repo; all pages are prerendered.
  - `src/content/projets/<slug>.json` — one file per project: name, subtitle, year, context, cover, links and content blocks (`Block` type in `src/lib/content.ts`).
  - `public/projets/<slug>/` — that project's images, videos and PDFs. All media under `public/` is in Git LFS (`.gitattributes`); new files are tracked automatically.
  - `src/lib/site.ts` — `siteUrl` from `SITE_URL` (build-time; Docker build arg in `compose.yaml`), intro, contacts, portrait and share image (`public/images/`), and `documents`: the current CV and PDF portfolio in `public/documents/`.
- `src/lib/projects.ts` — imports the project files; the import list sets the order and the numbers (01…). Also computes the giant initial.
- `src/content/renamed-projects.json` — old slug → new slug (e.g. `memoire-dsaa-2025` → `le-gout-du-vietnam`); `next.config.ts` turns them into 308 redirects.
- `src/components/Blocks.tsx` renders content blocks; `RichText.tsx` handles inline decorations (bold = green keyword).
- `src/components/ProjectStrip.tsx` (client) gets only card fields from the home page. Never import the content JSON or `lib/projects` from a client component, or all the content ships to the browser.
- Routes: `/`, `/projets/[slug]` (all slugs from `generateStaticParams`, unknown → `notFound()`), `/llms.txt`, `/llms-full.txt` (Markdown via `src/lib/markdown.ts`).

## Styling

- Plain CSS in `src/app/globals.css`. No Tailwind. Content blocks use `block-*` classes; site chrome uses plain names.
- Identity sampled from her PDFs: `--ink` #00309C (ultramarine), `--lime` #A3B23F, `--lime-pale` #D3E2A5, lots of white. `--keyword` is a darker lime for readable green text. Light + dark via `prefers-color-scheme`. Reuse tokens; don't add raw colors.
- Fonts: Federo (titles) and Saira (text) via `next/font/google`, web stand-ins for her licensed Frastha and Eurostile.
- Motifs from the PDFs: titles ending with a full stop, contour lines (`Rings.tsx`, deterministic SVG), pale-green pastille/sticker, 01–17 margin index, green wavy dividers, giant cropped initial cut by the blue "Projet suivant" band.
- Check visual changes with agent-browser in both themes and at ~390px width.

## Config notes

- `cacheComponents: true`, `partialPrefetching: false`: all routes are static; with prefetching on, awaiting `params` outside `<Suspense>` warns.
- `<html>`/`<body>` have `suppressHydrationWarning` for browser-extension attributes (LanguageTool, Grammarly). Don't remove it.
- Images go through `next/image` (sharp is bundled in the standalone output); pass real `width`/`height` from the JSON.
  Served as WebP at quality 60 (`qualities` in `next.config.ts`). The first request for each image/width takes ~0.5 s to encode; after that it is served from `.next/cache/images`, a Docker volume (`image-cache`) that survives rebuilds. The cache is keyed by URL, so a replaced image needs a new file name.
- Cover images morph from the home strip to the project page with React `<ViewTransition name="cover-<slug>">`; names must stay unique per page.

## Static export

`npm run build:static` = `STATIC_EXPORT=1 next build` (→ `output: "export"`) + `scripts/export-static.mjs`. In that mode `next.config.ts`:

- turns off `cacheComponents` (partial prerendering can't be exported) and config `redirects`;
- uses the custom image loader `src/lib/image-loader.ts`: `<Image>` URLs become `/_img/<src>.<width>.webp`.

The script then encodes every `/_img/…` URL found in the exported HTML with sharp (cached in `.next/cache/static-images`, keyed by source mtime) and writes a meta-refresh page `out/projets/<old-slug>.html` per renamed project.
Route handlers (`llms*.txt`) export `generateStaticParams` returning `[{}]`: static export requires them to be marked static, and Cache Components forbids `dynamic = "force-static"`. Keep it on any new route handler.
Pages are `out/projets/<slug>.html`: the web server must map `/projets/x` to `x.html` (nginx `try_files $uri $uri.html $uri/ =404;`).

## Commands

```bash
npm run dev                       # dev server
npm run lint && npm run build     # must both pass before committing
docker compose up -d --build      # production
docker compose exec web node scripts/warm-images.mjs   # after deploy: pre-generate optimized images
npm run build:static              # static export in out/ (no Node server needed)
```
