---
name: edit-content
description: Edit the site's content. Covers adding, editing, reordering or removing a project; adding images, videos or PDFs; changing the intro, contacts, CV or portfolio PDF; and supporting a new kind of content block. Use for any content change.
---

# Editing the content

The site is the source of truth: there is no CMS. Content edits only touch JSON files, media files and
`src/lib/site.ts`. You don't need to read any React or Next.js code for them.

## Rules

1. All visible text is in **French**. Match the existing text: typographic apostrophe `’`, not `'`.
2. Never write image `width`/`height` by hand: `npm run add-media` prints them, and `npm run check` reports any wrong ones.
3. Never replace a media file under the same name: optimized images are cached by URL. `add-media` always picks a new name.
4. A project's `slug` = its file name = its URL `/projets/<slug>` = its media folder `public/projets/<slug>/`.
5. After every change, run `npm run check` and fix every `ERROR` it prints. Then run `npm run verify` (check + lint + build) before committing.

## Where things are

| What | Where |
| --- | --- |
| One project (text, images, videos, PDFs) | `src/content/projets/<slug>.json` |
| Project order (sets the 01, 02… numbers) | the `entries` list in `src/lib/projects.ts` |
| Project media | `public/projets/<slug>/`, written as `/projets/<slug>/<file>` in JSON |
| Intro, contacts, portrait, share image, CV and portfolio PDFs | `src/lib/site.ts` (files in `public/images/`, `public/documents/`) |
| Redirects for renamed projects | `src/content/renamed-projects.json` (old slug → new slug) |

## Recipes

### Change some text in a project

1. Open `src/content/projets/<slug>.json` and find the text (search for a few words of it).
2. Edit the string inside `"rich": [[ "…" ]]`. Keep the segment structure (see Rich text below).
3. `npm run check`.

### Add images, a video or a PDF to a project

1. `npm run add-media -- <slug> <file1> <file2> …` (any photo format incl. HEIC, MOV/MP4, PDF).
   It converts, resizes, renames and copies the files, then prints ready-made blocks, for example:
   ```
   { "type": "image", "media": { "src": "/projets/museum/img-0001.jpg", "width": 1800, "height": 2400 } },
   ```
2. Paste the printed blocks into the `"blocks"` list of the project, where they should appear.
   Add a `"caption"` if wanted, put side-by-side images in a `column_list` (see Blocks).
3. `npm run check`.

YouTube video: no file needed, add `{"type": "video", "youtube": "VIDEO_ID", "title": "…"}`. `VIDEO_ID` is the 11 characters after `youtu.be/` or `watch?v=`.

### Add a project

1. `npm run new-project -- <slug> "Nom du projet"`, optionally `--after <other-slug>` to place it after another project
   (default: last). The slug is lowercase words joined by `-`, without accents: `le-potager-gourmand`.
   This creates the JSON file and media folder, and adds it to the list in `src/lib/projects.ts`.
2. `npm run add-media -- <slug> <files>…`, then paste the blocks into the JSON.
3. Fill in `subtitle`, `year`, `context`, `cover` (an image's `media` object) and the text blocks. Delete placeholders.
4. `npm run check`.

### Reorder projects

Move the line (e.g. `  museum,`) up or down in the `entries` list in `src/lib/projects.ts`. Don't touch the imports.

### Rename a project's URL (slug)

1. Rename the JSON file and the folder `public/projets/<old>/` to the new slug.
2. In the JSON: change `"slug"` and every `/projets/<old>/` path to `/projets/<new>/`.
3. In `src/lib/projects.ts`: change the file name in its `import` line.
4. Add `"<old>": "<new>"` to `src/content/renamed-projects.json` so old links keep working.
5. `npm run check`.

Renaming only the displayed title? Just change `"name"`: the URL stays.

### Remove a project

Delete its JSON file, its `import` line and list entry in `src/lib/projects.ts`, and its folder `public/projets/<slug>/`. Then `npm run check`.

### New CV or portfolio PDF

1. Copy the PDF into `public/documents/` with a new name, e.g. `tran-tiffany-cv-2027.pdf` (under 25 MiB, see Compressing a PDF).
2. In `src/lib/site.ts`, update `documents`: the `href` and the `label` (`"CV 2027"`).
3. Delete the old file. `npm run check`.

### Intro, contacts, portrait

Edit `src/lib/site.ts`: `intro`, `siteDescription`, `contacts` (`label`, `value` shown, `href` = `mailto:`, `tel:` or `https://`).
For a new portrait or share image, save it under a new name in `public/images/` and update `src` and the size `npm run check` reports.

## Project file

```json
{
  "slug": "la-retirada",
  "name": "La Retirada",
  "subtitle": "design de médiation (stage UOSMV)",
  "year": 2026,
  "context": "Un Œil Sur Ma Ville, Toulouse",
  "cover": {"src": "/projets/la-retirada/p22-1.jpg", "width": 2400, "height": 1699},
  "coverFocus": 0.5,
  "links": [{"label": "Voir la vidéo", "href": "https://youtu.be/…"}],
  "blocks": []
}
```

- Required: `slug`, `name`, `blocks`. Everything else is optional.
- `name` has **no final `.`**: the page adds it.
- `year` is a number (`2026`), not a string.
- `cover` is the image on the home page and at the top of the page. `coverFocus` is the vertical crop focus: 0 = top, 1 = bottom (default 0.5).
- `links` are outlined buttons under the title.

## Rich text

Text fields (`rich`, `caption`) are a **list of segments**. Each segment is `["text"]` or `["text", [decorations]]`:

```json
"rich": [
  ["L’objectif de ce "],
  ["jeu de piste", [["b"]]],
  [" est de faire découvrir "],
  ["le musée", [["a", "https://www.museum.toulouse.fr"]]],
  ["."]
]
```

- Mind the spaces at the edges of segments: `["Un "], ["mot", [["b"]]], [" ici."]`.
- Decorations are lists inside a list: `[["b"]]`, `[["b"], ["i"]]`, never `["b"]` alone.
- `["b"]` bold, shown as a **green keyword**: use it for 1–3 key phrases per paragraph, as in her PDFs.
- `["i"]` italic, `["s"]` strike, `["_"]` underline, `["c"]` code.
- `["a", "https://…"]` link. `["a", "/projets/<slug>"]` links to another project.
- `["h", "<color>"]` colored text (colors below; rarely needed).

## Blocks

`"blocks"` is a list. Each block has a `"type"`. Complete examples of every type:

```json
{"type": "text", "rich": [["Un paragraphe."]]}
{"type": "text"}
{"type": "sub_header", "rich": [["Titre de section"]]}
{"type": "sub_sub_header", "rich": [["Sous-titre"]]}
{"type": "quote", "rich": [["Une citation mise en avant."]], "size": "large"}
{"type": "bulleted_list", "rich": [["Premier point"]]}
{"type": "numbered_list", "rich": [["Première étape"]], "start": 1}
{"type": "callout", "icon": "💡", "color": "teal_background", "rich": [["Encadré."]], "children": []}
{"type": "divider"}
{"type": "image", "media": {"src": "/projets/<slug>/photo.jpg", "width": 1800, "height": 2400}, "caption": [["Légende"]], "display": {"width": 600}}
{"type": "video", "youtube": "dQw4w9WgXcQ", "title": "Titre de la vidéo"}
{"type": "video", "media": {"src": "/projets/<slug>/film.mp4"}, "display": {"width": 1920, "height": 1080}}
{"type": "pdf", "media": {"src": "/projets/<slug>/dossier.pdf"}, "title": "Dossier de recherche", "display": {"height": 720}}
{"type": "file", "media": {"src": "/projets/<slug>/plans.zip"}, "title": "Télécharger les plans"}
```

- `{"type": "text"}` alone is an empty line (spacing).
- `sub_header` is the usual section title. Avoid `header`: it competes with the page title.
- Consecutive `bulleted_list` (or `numbered_list`) blocks form one list: one block per item.
- `divider` is the green wavy line between sections.
- `image`: `display.width` (px) makes it smaller than the full column. `display.align`: `"left"`, `"center"`, `"right"`.
- `video`: either `youtube` or `media`, not both. `display` width/height only set the aspect ratio (default 16:9).
- `pdf` shows an embedded viewer; `file` is just a download link.
- `color` (on `text`, headers, `quote`, lists, `callout`): `gray`, `brown`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `red`, or the same with `_background` (`"teal_background"`).

Columns (side-by-side images or text): a `column_list` contains only `column` blocks. Each column has a `ratio`
(its share of the width; the ratios add up to 1, or omit them all for equal widths) and its own `children` blocks:

```json
{
  "type": "column_list",
  "children": [
    {"type": "column", "ratio": 0.5, "children": [
      {"type": "image", "media": {"src": "/projets/<slug>/a.jpg", "width": 1600, "height": 1200}}
    ]},
    {"type": "column", "ratio": 0.5, "children": [
      {"type": "text", "rich": [["Texte à côté de l’image."]]}
    ]}
  ]
}
```

On phones, columns stack vertically.

## Media details

`npm run add-media` handles these; only for manual work:

- Images: JPG (photos) or PNG/WebP (transparency), at most 2400 px, real displayed size in the JSON
  (watch EXIF rotation: phone photos can be stored sideways; `npm run check` gives the displayed size).
- Videos: MP4 (H.264). Long videos are better on YouTube.
- Every file must be under 25 MiB (Cloudflare Pages limit).
- File names: lowercase, no spaces, no accents.
- Delete files no block uses anymore (`npm run check` lists them as warnings).

### Compressing a PDF

`add-media` does it automatically for PDFs over 25 MiB when Ghostscript is installed (`brew install ghostscript`). By hand
(images at 200 dpi, looks identical on screen, usually 3–5× smaller):

```bash
gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dCompatibilityLevel=1.6 -dDetectDuplicateImages=true \
  -dDownsampleColorImages=true -dColorImageResolution=200 -dColorImageDownsampleThreshold=1.1 \
  -dDownsampleGrayImages=true -dGrayImageResolution=200 -dGrayImageDownsampleThreshold=1.1 \
  -dAutoFilterColorImages=false -dColorImageFilter=/DCTEncode -dAutoFilterGrayImages=false -dGrayImageFilter=/DCTEncode \
  -dJPEGQ=85 -sOutputFile=out.pdf in.pdf
```

## Verify

1. `npm run check` until it prints `0 errors`. Each error names the file, the place in it
   (`blocks[3].children[0].media` = 4th block → its 1st child → `media`) and the fix.
2. `npm run verify` (check + lint + build) must pass before committing.
3. Look at the changed page with `npm run dev` (http://localhost:3000/projets/<slug>). For layout changes, check light and dark mode and a ~390px wide window.

## A new block type (code change)

Only when no existing block fits:

1. Add any new fields to `Block` in `src/lib/content.ts`.
2. Add a `case` in `BlockView` (`src/components/Blocks.tsx`). Reuse `RichText`, `colorClass`, `Figure`/`mediaWidth` and nested `<Blocks blocks={block.children} />`.
   Interactive blocks need a small `"use client"` component receiving plain props. Never import the content JSON or `lib/projects` client-side.
3. Style it with `block-*` classes in `src/app/globals.css`, using the existing tokens (see "Styling" in AGENTS.md).
4. Add its Markdown output in `blocksToLines` (`src/lib/markdown.ts`) so `/llms-full.txt` includes it.
5. Add it to `BLOCKS` in `scripts/check-content.mjs` and to the examples above.
