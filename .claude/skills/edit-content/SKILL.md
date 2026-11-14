---
name: edit-content
description: Edit the site's content. Covers adding, editing, reordering or removing a project; adding images, videos or PDFs; changing the intro, contacts, CV or portfolio PDF; and supporting a new kind of content block. Use for any content change.
---

# Editing the content

The site is the source of truth: there is no CMS or import. Content lives in the repo:

| What | Where |
| --- | --- |
| One project | `src/content/projets/<slug>.json` |
| Project order (sets the 01, 02… numbers) | the import list in `src/lib/projects.ts` |
| Project media | `public/projets/<slug>/`, referenced as `/projets/<slug>/<file>` |
| Intro, contacts, portrait, share image, CV / portfolio PDFs | `src/lib/site.ts` (files in `public/images/`, `public/documents/`) |
| Redirects for renamed slugs | `src/content/renamed-projects.json` (old slug → new slug) |

Keep all text in French. Bold (`["b"]`) shows as a green keyword, as in her PDFs: use it for a few key phrases per project.

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
  "blocks": [ … ]
}
```

- `slug` must match the file name. It is the URL `/projets/<slug>`, so after renaming one, add the old slug to `src/content/renamed-projects.json`.
- Optional fields: `subtitle`, `year`, `context`, `cover`, `coverFocus` (vertical crop focus, 0 = top, 1 = bottom; default 0.5) and `links` (outlined pills under the title).
- No `.` after `name`: the page adds the full stop.
- New project: create the JSON and the `public/projets/<slug>/` folder, then add the import to `src/lib/projects.ts` in the right position.
- Removing a project: delete its JSON, its import and its media folder.

## Blocks

Every block has a `type`. `rich` and `caption` are rich text: `[["plain "], ["keyword", [["b"]]], [" link", [["a", "https://…"]]]]`. Decorations: `b`, `i`, `s`, `_`, `c`, `["a", href]` (a link starting with `/` is internal), `["h", color]`.

| type | fields |
| --- | --- |
| `text` | `rich`; `{"type": "text"}` alone is a blank line |
| `sub_header`, `sub_sub_header` (`header` exists, but avoid it under the page title) | `rich` |
| `quote` | `rich`, `size: "large"` |
| `bulleted_list`, `numbered_list` | `rich`, `children`; consecutive items form one list, `start` sets the first number |
| `callout` | `icon` (emoji), `color` (e.g. `"teal_background"`), `children` |
| `divider` | wavy green rule |
| `column_list` | `children`: blocks of type `column` with `ratio` (shares summing to 1) and `children` |
| `image` | `media` {src, width, height}, optional `caption`, `display.width` in px (else full width) |
| `video` | `youtube` (video id) or `media.src` (MP4); `display` {width, height} sets the ratio; `title` |
| `pdf` | `media.src`, `title`, `display.height` (viewer height) |
| `file` | `media.src`, `title` (a download link) |

Colors (`color` on a block, or the `h` decoration): `gray`, `brown`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `red`, each also as `<color>_background`.

## Adding media

Images must carry their real pixel size, and be web formats capped at 2400px:

```bash
sips -s format jpeg -Z 2400 IN.HEIC --out public/projets/<slug>/name.jpg   # HEIC/TIFF/PNG photo → JPG
sips -g pixelWidth -g pixelHeight public/projets/<slug>/name.jpg            # width/height for the JSON
ffmpeg -i IN.mov -c:v libx264 -crf 23 -movflags +faststart -an public/projets/<slug>/name.mp4
```

- Keep PNG/WebP when transparency matters (cut-outs, rounded corners).
- Use lowercase file names without spaces.
- To replace an image, use a new file name: optimized images are cached by URL for a year (server volume and browsers), so the old version would keep showing.
- Large videos are better on YouTube (`youtube` field).
- Every file must stay under 25 MiB (Cloudflare Pages limit; `npm run build:static` fails otherwise). Compress big PDFs with Ghostscript, images at 200 dpi (looks identical on screen, usually 3–5× smaller):

  ```bash
  gs -q -dNOPAUSE -dBATCH -dSAFER -sDEVICE=pdfwrite -dCompatibilityLevel=1.6 -dDetectDuplicateImages=true \
    -dDownsampleColorImages=true -dColorImageResolution=200 -dColorImageDownsampleThreshold=1.1 \
    -dDownsampleGrayImages=true -dGrayImageResolution=200 -dGrayImageDownsampleThreshold=1.1 \
    -dAutoFilterColorImages=false -dColorImageFilter=/DCTEncode -dAutoFilterGrayImages=false -dGrayImageFilter=/DCTEncode \
    -dJPEGQ=85 -sOutputFile=out.pdf in.pdf
  ```
- Delete files that are no longer referenced.

## New CV or PDF portfolio

Copy the new file into `public/documents/` (compressed under 25 MiB, see Adding media), then update `documents` in `src/lib/site.ts` (href and label). Delete the old file.

## A new block type

1. Add any new fields to `Block` in `src/lib/content.ts`.
2. Add a `case` in `BlockView` (`src/components/Blocks.tsx`). Reuse `RichText`, `colorClass`, `Figure`/`mediaWidth` and nested `<Blocks blocks={block.children} />`.
   - Interactive blocks need a small `"use client"` component receiving plain props. Never import the content JSON or `lib/projects` client-side.
3. Style it with `block-*` classes in `src/app/globals.css`, using the existing tokens (see "Styling" in CLAUDE.md).
4. Add its Markdown output in `blocksToLines` (`src/lib/markdown.ts`) so `/llms-full.txt` includes it.

## Verify

- Run `npm run lint && npm run build`. The build type-checks the imports and prerenders every project.
- Open the changed pages with `npm run dev`. For visual changes, check light and dark mode and ~390px width (agent-browser).
- Check every referenced file exists:

```bash
grep -rhoE '"/(projets|images|documents)/[^"]+' src/content src/lib | tr -d '"' | sort -u | while read -r f; do [ -e "public$f" ] || echo "missing $f"; done
```
