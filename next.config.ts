import type { NextConfig } from "next";

/** Old URLs (first version of the site) of projects renamed after the 2026 portfolio. */
const renamedProjects: Record<string, string> = {
  "memoire-dsaa-2025": "le-gout-du-vietnam",
  "pret-a-recolter-2023": "pret-a-recolter",
  "stage-agence-kascen-2024": "trainworld",
  "museum-toulouse-2024": "museum",
  "textiles-de-foire-2023": "textile-de-foire",
};

const nextConfig: NextConfig = {
  /* Self-hosted: `next build` emits a minimal Node server in .next/standalone (see Dockerfile). */
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: false,
  // Silence the lockfile-detection warning when a parent folder has its own package-lock.json.
  turbopack: { root: process.cwd() },
  images: {
    // WebP only: ~6× faster to encode than AVIF on first request, for similar sizes at this quality.
    formats: ["image/webp"],
    // Single allowed quality: every <Image> (default 75) is served at 60, ~15–20% lighter with no visible loss.
    qualities: [60],
    // Drop the default 2048/3840 widths: nothing is shown wider than 1200 CSS px (×2 ≈ 1920 covers retina),
    // and those were the slowest variants to generate on first request.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Optimized files are cached by URL in .next/cache/images (a Docker volume, see compose.yaml):
    // replacing an image under the same file name keeps serving the old one, so give it a new name.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async redirects() {
    return Object.entries(renamedProjects).map(([from, to]) => ({
      source: `/projets/${from}`,
      destination: `/projets/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
