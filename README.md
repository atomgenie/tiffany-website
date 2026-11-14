# Portfolio Design — Tiffany Tran

Tiffany Tran's portfolio site: self-hosted Next.js, styled after her 2026 CV and PDF portfolio.

All content is static and lives in this repo:

- `src/content/projets/<slug>.json` holds one project each (text, images, videos, PDFs as blocks).
- `src/lib/projects.ts` sets the project order (and so their numbers).
- `public/projets/<slug>/` holds each project's media.
- `src/lib/site.ts` holds the intro, the contacts and the links to the CV and PDF portfolio (`public/documents/`).

See `.claude/skills/edit-content/SKILL.md` for the content format and how to add a project or images.

Routes:

| Route              | Content                                      |
| ------------------ | -------------------------------------------- |
| `/`                | Home: intro, project strip and list, about, contact |
| `/projets/[slug]`  | One page per project (prerendered at build)  |
| `/llms.txt`        | [llms.txt](https://llmstxt.org) index for LLMs: summary, contact, one line per project |
| `/llms-full.txt`   | Full text of every project as Markdown (generated from the same content) |

## Development

Images, videos and PDFs under `public/` are stored with [Git LFS](https://git-lfs.com) (see `.gitattributes`). Install it before cloning (`brew install git-lfs && git lfs install`), or run `git lfs pull` after. Without it, `public/` only holds small pointer files.

```bash
npm install
npm run dev                       # http://localhost:3000
npm run lint && npm run build     # before committing
```

## Self-hosting

`next.config.ts` uses `output: "standalone"`, so the build is a small Node server.

### Docker

Build from a checkout where `git lfs pull` has run: the image copies `public/` from the working tree.

```bash
docker compose up -d --build     # serves on :3000
```

Set `SITE_URL` in `compose.yaml` (a build arg) to the public URL; it is used for Open Graph tags.

### Plain Node (≥ 20.9)

```bash
npm ci
SITE_URL=https://tiffany.tamtanguy.fr npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Put a reverse proxy (Caddy, nginx, Traefik…) in front for HTTPS. Images are resized and converted to WebP on demand by the built-in Next.js image optimizer; resized versions are cached in `.next/cache/images`.

### Static files (any web host, no Node)

```bash
SITE_URL=https://tiffany.tamtanguy.fr npm run build:static
```

This writes a complete static site to `out/`: HTML pages, `llms.txt`, media, and every image pre-resized to WebP under `out/_img/` (the first build encodes ~1,500 variants in about 2 minutes; later builds reuse `.next/cache/static-images` and only encode new or changed images). Old project URLs become small HTML redirect pages.

Upload `out/` to any static host. Project pages are `projets/<slug>.html`, so the server must serve `/projets/<slug>` from that file (GitHub Pages, Netlify, Cloudflare Pages and Caddy's `try_files` do; for nginx):

```nginx
location / {
  try_files $uri $uri.html $uri/ =404;
}
error_page 404 /404.html;
```
