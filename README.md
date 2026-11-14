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

Put a reverse proxy (Caddy, nginx, Traefik…) in front for HTTPS. Images are resized and converted to AVIF/WebP on demand by the built-in Next.js image optimizer; resized versions are cached in `.next/cache/images`.
