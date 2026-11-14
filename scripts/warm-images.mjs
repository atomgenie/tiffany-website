// Pre-generates every optimized image (next/image) so no visitor waits for the first encode.
// Crawls the home page and every project page, then requests each srcset URL as a modern browser would.
// Already-cached variants return instantly, so re-running after a deploy only encodes new images.
//
// On the server, after `docker compose up -d --build`:
//   docker compose exec web node scripts/warm-images.mjs
// Locally: node scripts/warm-images.mjs http://localhost:3000

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const concurrency = 2;

async function html(path) {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

const decode = (s) => s.replaceAll("&amp;", "&");

const home = await html("/");
const pages = ["/", ...new Set([...home.matchAll(/href="(\/projets\/[^"#?]+)"/g)].map((m) => m[1]))];

const urls = new Set();
for (const page of pages) {
  const body = page === "/" ? home : await html(page);
  for (const [, srcset] of body.matchAll(/srcSet="([^"]+)"/g)) {
    for (const entry of decode(srcset).split(", ")) urls.add(entry.split(" ")[0]);
  }
}

console.log(`${pages.length} pages, ${urls.size} image variants`);
const queue = [...urls];
let done = 0;
let failed = 0;
const started = Date.now();

await Promise.all(
  Array.from({ length: concurrency }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const res = await fetch(base + url, { headers: { Accept: "image/avif,image/webp,*/*" } }).catch(() => null);
      await res?.arrayBuffer();
      if (!res?.ok) {
        failed++;
        console.error(`failed (${res?.status ?? "network"}): ${url}`);
      }
      if (++done % 50 === 0) console.log(`${done}/${urls.size}`);
    }
  }),
);

console.log(`done: ${done - failed} ok, ${failed} failed, ${Math.round((Date.now() - started) / 1000)}s`);
process.exitCode = failed ? 1 : 0;
