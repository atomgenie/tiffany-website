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
    formats: ["image/avif", "image/webp"],
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
